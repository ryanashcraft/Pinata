
const FOLDER_TITLE = "Pi\u00F1ata Tabs";

var mainWindowId;

chrome.tabs.onUpdated.addListener(function(tabId, updateInfo, tab) {
	var url = updateInfo.url;

	if (url != undefined) {
		checkForHit(url, tab);
	}
});

chrome.tabs.onCreated.addListener(function(tab) {
	var url = tab.url;

	if (url != undefined) {
		checkForHit(url, tab);
	}
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	openPinnedTabsFromBookmarks();
});

function init() {
	chrome.windows.getCurrent(function(w) {
		mainWindowId = w.id;
	});

	openPinnedTabsFromBookmarks();
}

function openPinnedTabsFromBookmarks() {
	chrome.bookmarks.getTree(function(tree) {
		var folderFound = false;
		var otherBookmarksTree = tree[0].children[1];
		var folder;

		// check if folder already exists
		for (i in otherBookmarksTree.children) {
			if (otherBookmarksTree.children[i].title == FOLDER_TITLE) {
				folder = otherBookmarksTree.children[i];
				break;
			}
		}

		// if it doesn't, make it
		if (folder == undefined) {
			console.log("Bookmarks folder not found, creating it.")

			chrome.bookmarks.create({
				title: FOLDER_TITLE
			}, function(tree) {
				for (i = 0; i < folder.children.length; i++) {
					openUrlInTabIfShould(folder.children[i].url, parseInt(folder.children[i].index));
				}
			});
		} else {
			for (i = 0; i < folder.children.length; i++) {
				openUrlInTabIfShould(folder.children[i].url, parseInt(folder.children[i].index));
			}
		}
	});
}

function openUrlInTabIfShould(url, index) {
	if (url != null) {
		chrome.windows.get(mainWindowId, {
			populate: true
		}, function(w) {
			var shouldBeOpened = tabShouldBeOpened(w.tabs, url);
			if (shouldBeOpened) {
				chrome.tabs.create({
					url: url,
					pinned: true,
					active: true,
					index: index
				}, function(tab) {

				});
			}
		});
	};
}

function tabShouldBeOpened(tabs, url) {
	var shouldBeOpened = true;
	for (i in tabs) {
		var t = tabs[i];
		if (!t.pinned) {
			continue;
		}

		if (urlMatch(t.url, url)) {
			shouldBeOpened = false;
		}
	}

	return shouldBeOpened;
}

function urlMatch(urlA, urlB) {
	var domainRegex = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/igm;
	var a = domainRegex.exec(urlA);
	domainRegex.lastIndex = 0;
	var b = domainRegex.exec(urlB);

	if (a == null || b == null) {
		return false;
	}

	var hostnameA = a[4];
	var hostnameB = b[4];

	if (hostnameA.substring(0, 4) == "www.") {
		hostnameA = hostnameA.substring(4);
	}
	if (hostnameB.substring(0, 4) == "www.") {
		hostnameB = hostnameB.substring(4);
	}

	if (hostnameA == hostnameB) {
		if (a[5] == b[5]) {
			return "full";
		} else {
			return "partial";
		}
	}
}

function checkForHit(url, tab) {
	chrome.windows.get(mainWindowId, {
		populate: true
	}, function(w) {
		var openedFromPinnedTabId = null;

		for (i in w.tabs) {
			var t = w.tabs[i];
			if (t.pinned == true && tab.openerTabId == t.id) {
				openedFromPinnedTabId = t.id;
				break;
			}
		}

		for (j in w.tabs) {
			var t = w.tabs[j];
			if (tab.id != t.id
				&& t.pinned
				&& tab.windowId == mainWindowId
				&& openedFromPinnedTabId != t.id) {
				var match = urlMatch(url, t.url);
				if (match == "full") {
					hit(tab.id, t, t.windowId);
				} else if (match == "partial") {
					hit(tab.id, t, t.windowId, url);
				}
			}
		}
	});
}

function hit(tabId, pinnedTab, windowId, newUrl) {
	chrome.tabs.remove(tabId, function() {
		var updateInfo;

		if (newUrl == undefined) {
			updateInfo = {
				highlighted: true
			};
		} else {
			updateInfo = {
				url: newUrl,
				highlighted: true
			};
		}

		chrome.tabs.update(pinnedTab.id, updateInfo);
	});
}
