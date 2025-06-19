importScripts("config.js");
importScripts("keepAlive.js");

chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log(
    `New version ${details.version} available. Reloading extension...`
  );
  chrome.runtime.reload();
});

// Check for updates on startup
chrome.runtime.requestUpdateCheck((status) => {
  if (status === "update_available") {
    console.log("Extension update available, reloading...");
    chrome.runtime.reload();
  } else {
    console.log("No update available.");
  }
});

//wait for fetch request from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Set user logging session
  if (request.message === "setUserLogged") {
    // if value is true that means user logged, other wise not logged
    chrome.storage.sync.set({ isLogged: request.value }, () => {
      if (request.reload != undefined && request.reload) {
        reloadRoughWaterMedia();
      }
      // Set cookies
      if (request.value && request.accessToken != undefined) {
        setCookies(request.accessToken);
      }
      // not allow tru
      if (request.value == false) {
        setCookies(request.value);
      }
    });
  }

  // set icon drag position
  if (request.message === "setLogoPosition") {
    // set icon drag position into sync storage
    chrome.storage.sync.set({ logoPosition: request.value }, () => {});
  }

  // Get cookies
  if (request.message === "getCookies") {
    chrome.cookies.get(
      { url: COOKIE_DOMAIN_NAME, name: COOKIE_NAME },
      (cookie) => {
        sendResponse(cookie);
      }
    );
  }

  // Open new tab
  if (request.message === "openNewTab") {
    chrome.tabs.create({ url: request.url }, (tab) => {
      const tabId = tab.id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: clickChatIcon,
      });
    });
  }

  if (request.message === "fetchHtml") {
    const response = {
      data: null,
      status: 0,
    };
    fetch(request.url, {
      method: "get",
      headers: {
        "Content-Type": "text/html",
      },
      body: request.request_payload,
    })
      .then((res) => {
        response.status = res.status;
        return res.text();
      })
      .then((data) => {
        response.data = data;
        sendResponse(response);
      })
      .catch(() => {
        response.status = 404;
        sendResponse(response);
      });
  }

  // open new tab and fill optimize data
  if (request.message === "open_new_tab") {
    chrome.tabs.create(
      {
        url: request.value.url,
      },
      function (tab) {
        // Call in SquareSpace editor page
        if (request?.value?.isSquareSpace) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: updateIframeUrl,
            args: [request?.value?.scanUrl],
          });
          // return true; // Comment out if want to Open SQSP editor page
        }

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (info.status === "complete" && tabId === tab.id) {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(() => {
              // if (!request?.value?.isSquareSpace) {
              chrome.tabs
                .sendMessage(tab.id, {
                  message: "open_new_tab",
                  url: request?.value?.url,
                  id: request?.value?.id ?? [],
                })
                .then((response) => {});
              // }
            }, 1000);
          }
        });
      }
    );
  }

  if (request.message === "close_tab") {
    chrome.storage.local.get("authTabId", (data) => {
      if (data.authTabId) {
        chrome.tabs.remove(data.authTabId);
        chrome.storage.local.remove("authTabId"); // Clear stored tab ID
      }
    });
  }

  // Open price page
  if (request.message === "openBilling") {
    chrome.tabs.create({ url: request.url }, (tab) => {
      const tabId = tab.id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: clickPricePageButton,
      });
    });
  }

  // Open google auth tab
  if (request.message === "openGoogleAuth") {
    chrome.tabs.create({ url: request.url }, (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.storage.local.set({ authTabId: tab.id });
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: openGoogleTabFun,
            args: [request.pageUrl],
          });
        }
      });
    });
  }

  // set mirror auth cookies
  if (request.message === "set_mirror_auth") {
    setCookies(request.value.token);
  }

  if (request.message === "open_new_tab_lead_url") {
    chrome.tabs.create(
      {
        url: request.value.url,
      },
      (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (info.status === "complete" && tabId === tab.id) {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(() => {
              chrome.tabs
                .sendMessage(tab.id, {
                  message: "open_new_tab",
                  url: request?.value?.url,
                  isLeadRun: true,
                })
                .then((response) => {});
            }, 1000);
          }
        });
      }
    );
  }

  if (request.message === "extention_visibility") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          message: "updateExtensionVisibility",
        });
      }
    });
  }

  return true;
});

// Reload rough water media web page
const reloadRoughWaterMedia = () => {
  chrome.windows.getAll({ populate: true }, (window_list) => {
    let windowListLength = window_list.length;
    for (let i = 0; i < windowListLength; i++) {
      let tabs = window_list[i].tabs;
      let tabsLength = tabs.length;
      for (let j = 0; j < tabsLength; j++) {
        let tabURL = tabs[j].url;
        if (tabURL != undefined) {
          RELOAD_PAGE_HOSTNAME.map((host) => {
            if (tabURL.indexOf(host) !== -1) {
              chrome.tabs.reload(tabs[j].id);
            }
          });
        }
      }
    }
  });
};

/**
 * Set Cookies name
 */
const setCookies = (value) => {
  chrome.cookies.set(
    {
      name: COOKIE_NAME,
      url: COOKIE_DOMAIN_NAME,
      value: `${value}`,
      expirationDate: getExpTime(),
      secure: true,
    },
    (cookie) => {}
  );
};

const getExpTime = () => {
  const d = new Date();
  d.setTime(d.getTime() + 60 * 24 * 60 * 60 * 1000);
  return d.getTime();
};

/**
 * Inject script
 */
const clickChatIcon = () => {
  setTimeout(() => {
    // document.querySelector(".circle-widget-trigger").click();
    const widget = document.querySelector(".intercom-launcher");
    if (widget) {
      widget.click();
    }
    if (widget == null) {
      const iframeWidget = document.querySelector(".intercom-launcher-frame");
      const launchElement =
        iframeWidget.contentDocument.querySelector(".intercom-launcher");
      if (launchElement) {
        launchElement.click();
      }
    }
  }, 2000);
};

/**
 * Inject script into price button
 */
const clickPricePageButton = () => {
  setTimeout(() => {
    document.querySelector("#change-plan-btn").click();
  }, 2000);
};

/**
 * Inject script into google auth tab
 */
const openGoogleTabFun = (url) => {
  localStorage.setItem("GSCRequestURL", url);
  localStorage.setItem("GSCConnectExt", true);
};

// Check whether new version is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install") {
    reloadRoughWaterMedia();
  }

  chrome.storage.local.set({ disableExtensionConformationStatus: false });
});

/**
 * Updates the src URL of the iframe after it has loaded successfully.
 * @param {string} url - The URL to update the iframe's src to.
 */
const updateIframeUrl = (url) => {
  /**
   * Event handler for iframe load event.
   */
  const handleIframeLoad = () => {
    setTimeout(() => {
      // Get the iframe element
      const iframe = document.querySelector("#sqs-site-frame");

      // Change the src URL
      const pathname = new URL(url).pathname;
      iframe.src = pathname;

      // Remove the event listener
      iframe.removeEventListener("load", handleIframeLoad);
      // Disconnect the observer
      documentObserver.disconnect();
    }, 5000);
  };

  /**
   * Mutation observer callback to handle document mutations.
   *
   * @param {MutationRecord[]} mutationsList - List of mutations.
   * @param {MutationObserver} observer - The MutationObserver instance.
   */
  const handleDocumentMutations = (mutationsList, observer) => {
    const iframe = document.querySelector("#sqs-site-frame");
    if (iframe?.src) {
      document
        .querySelector("#sqs-site-frame")
        .addEventListener("load", handleIframeLoad);
    }
  };

  // Create a MutationObserver to observe document mutations
  const documentObserver = new MutationObserver(handleDocumentMutations);
  documentObserver.observe(document, { attributes: true, subtree: true });
};
