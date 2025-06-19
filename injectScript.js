const channel = new BroadcastChannel("seo-space-chrome");
channel.addEventListener(
  "message",
  (event) => {
    if (
      event &&
      event.data != undefined &&
      event.data.message === "load_images"
    ) {
      try {
        // iframe
        if (document.querySelector("#sqs-site-frame")) {
          var images = document
            .querySelector("#sqs-site-frame")
            .contentWindow.document.querySelectorAll("img[data-src]");
          for (var i = 0; i < images.length; i++) {
            document
              .querySelector("#sqs-site-frame")
              .contentWindow.ImageLoader.load(images[i], { load: true });
          }
          Array.from(
            document
              .querySelector("#sqs-site-frame")
              .contentWindow.document.querySelectorAll("h1")
          ).map((selectedElement) => {
            const styles = getComputedStyle(selectedElement);
            const rect = selectedElement.getBoundingClientRect();
            let isHiddenElement =
              styles.display !== "none" && styles.visibility !== "hidden";
            let isHeightWidth = rect?.x != 0 && rect?.y != 0 && rect.width != 0;
            if (!isHiddenElement || !isHeightWidth) {
              selectedElement.setAttribute("data-isHidden", "true");
            }
          });
        } else {
          var images = document.querySelectorAll("img[data-src]");
          if (window?.ImageLoader?.load) {
            for (var i = 0; i < images.length; i++) {
              window.ImageLoader.load(images[i], { load: true });
            }
          }
          Array.from(document.querySelectorAll("h1")).map((selectedElement) => {
            const styles = getComputedStyle(selectedElement);
            const rect = selectedElement.getBoundingClientRect();
            let isHiddenElement =
              styles.display !== "none" && styles.visibility !== "hidden";
            let isHeightWidth = rect?.x != 0 && rect?.y != 0 && rect.width != 0;
            if (!isHiddenElement || !isHeightWidth) {
              selectedElement.setAttribute("data-isHidden", "true");
            }
          });
        }
      } catch (e) {}
    }
  },
  false
);
