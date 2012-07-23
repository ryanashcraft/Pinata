
var pinnedTabs = [];

chrome.tabs.onUpdated.addListener(function(tabId, updateInfo, tab) {
	var url = updateInfo.url;

	setPinnedTabs();

	if (url != undefined) {
		checkForHit(url, tabId);
	}
});

chrome.tabs.onCreated.addListener(function(tab) {
	var url = tab.url;

	setPinnedTabs();

	if (url != undefined) {
		checkForHit(url, tab.id);
	}
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	var url, index;
	var closedTabIndex;
	for (i in pinnedTabs) {
		if (pinnedTabs[i].id == tabId) {
			url = pinnedTabs[i].url;
			index = pinnedTabs[i].index;
			closedTabIndex = i;
			break;
		}
	}

	if (url != undefined) {
		chrome.tabs.create({
			url: url,
			pinned: true,
			active: false
			// index: index
		}, function(tab) {
			pinnedTabs[closedTabIndex].id = tab.id;
		})
	}
});

function init() {
	setPinnedTabs();
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
	setPinnedTabs();
});

chrome.tabs.onHighlighted.addListener(function(highlightInfo) {
	setPinnedTabs();
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo) {
	setPinnedTabs();
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo) {
	setPinnedTabs();
});

chrome.tabs.onMoved.addListener(function(tabId, moveInfo) {
	setPinnedTabs({
		windowId: moveInfo.windowId,
		tabId: tabId,
		toIndex: moveInfo.toIndex
	});
});

chrome.management.onEnabled.addListener(function(info) {
	setPinnedTabs();
});

function setPinnedTabs(updateInfo) {
	chrome.windows.getCurrent({
		populate: true
	}, function(w) {
		for (j in w.tabs) {
			var t = w.tabs[j];
			if (t.pinned) {
				var toIndex = t.index;

				if (updateInfo != undefined && (w.id == updateInfo.windowId && t.id == updateInfo.tabId)) {
					toindex = updateInfo.toIndex;
				}

				pinnedTabs.push({
					id: t.id,
					url: t.url,
					index: toIndex
				});
			}
		}
	});
}

function urlMatch(urlA, urlB) {
	var domainRegex = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/igm;
	var a = domainRegex.exec(urlA);
	domainRegex.lastIndex = 0;
	var b = domainRegex.exec(urlB);

	if (a == null || b == null) {
		return false;
	}

	if (a[4] == b[4]) {
		if (a[5] == b[5]) {
			return "full";
		} else {
			return "partial";
		}
	}
}

function checkForHit(url, tabId) {
	chrome.windows.getAll({
		populate: true
	}, function(windows) {
		for (i in windows) {
			var w = windows[i];
			for (j in w.tabs) {
				var t = w.tabs[j];
				if (tabId != t.id && t.pinned) {
					var match = urlMatch(url, t.url);
					if (match == "full") {
						hit(tabId, t, t.windowId);
					} else if (match == "partial") {
						hit(tabId, t, t.windowId, url);
					}
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
