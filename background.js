
var mainWindow;

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

// chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
// 	var url, index;
// 	var closedTabIndex;

// 	if (url != undefined) {
// 		chrome.tabs.create({
// 			url: url,
// 			pinned: true,
// 			active: false
// 			// index: index
// 		}, function(tab) {
// 			pinnedTabs[closedTabIndex].id = tab.id;
// 		})
// 	}
// });

function init() {
	chrome.windows.getCurrent(function(w) {
		mainWindow = w;
	});
}

chrome.tabs.onMoved.addListener(function(tabId, moveInfo) {
	
});

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

function checkForHit(url, tab) {
	chrome.windows.getAll({
		populate: true
	}, function(windows) {
		for (i in windows) {
			var w = windows[i];
			for (j in w.tabs) {
				var t = w.tabs[j];
				if (tab.id != t.id
					&& t.pinned
					&& tab.windowId == mainWindow.id) {
					var match = urlMatch(url, t.url);
					if (match == "full") {
						hit(tab.id, t, t.windowId);
					} else if (match == "partial") {
						hit(tab.id, t, t.windowId, url);
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
