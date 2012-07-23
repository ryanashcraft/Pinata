
var urls = [];

chrome.tabs.onUpdated.addListener(function(tabId, updateInfo, tab) {
	var url = updateInfo.url;

	if (url != undefined) {
		checkForHit(url, tabId);
	}

	setUrls();
});

chrome.tabs.onCreated.addListener(function(tab) {
	var url = tab.url;

	if (url != undefined) {
		checkForHit(url, tab.id);
	}

	setUrls();
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	var url;
	for (i in urls) {
		if (urls[i].id == tabId) {
			url = urls[i].url;
			break;
		}
	}

	if (url != undefined) {
		chrome.tabs.create({
			url: url,
			pinned: true
		}, function(tab) {
		})
	}

	setUrls();
});

function setUrls() {
	chrome.windows.getAll({
		populate: true
	}, function(windows) {
		for (i in windows) {
			var w = windows[i];
			for (j in w.tabs) {
				var t = w.tabs[j];
				if (t.pinned) {
					urls.push({
						id: t.id,
						url: t.url
					});
				}
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
		if (a[5] == b[5] && a[8] == b[8]) {
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