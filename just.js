const pdfViewer = {
    open: (title, url) => {
      state.pdf.currentTitle = title;
      
      // Handle Google Drive links differently
      if (utils.isGoogleDriveUrl(url)) {
        this.handleGoogleDrivePdf(title, url);
        return;
      }
      
      // Regular PDF handling
      this.showInModal(title, utils.getDirectPdfUrl(url));
    },
    
    handleGoogleDrivePdf: (title, url) => {
      const fileId = utils.extractGoogleDriveFileId(url);
      if (!fileId) {
        this.showError("Invalid Google Drive link");
        return;
      }
      
      // Option 1: Open in Google's native viewer (recommended)
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      window.open(previewUrl, '_blank');
      
      // Option 2: Fallback to our viewer
      setTimeout(() => {
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        this.showInModal(title, directUrl);
      }, 1000);
    },
    
    showInModal: (title, url) => {
        elements.pdfViewer.title.textContent = title;
        state.pdf.currentUrl = url;
        elements.pdfViewer.modal.classList.add('active');
        
        // Clear previous PDF
        if (state.pdf.doc) {
          state.pdf.doc.destroy();
          state.pdf.doc = null;
        }
        
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          withCredentials: false
        });
        
        loadingTask.promise.then((pdf) => {
          state.pdf.doc = pdf;
          elements.pdfViewer.totalPages.textContent = pdf.numPages;
          state.pdf.pageNum = 1;
          pdfViewer.renderPage(state.pdf.pageNum);
        }).catch((error) => {
          console.error('PDF loading error:', error);
          pdfViewer.showError("Failed to load PDF. Please try downloading the file instead.");
          
          // Fallback to direct download
          setTimeout(() => {
            pdfViewer.download();
          }, 1500);
        });
      },
      
      showError: (message) => {
        alert(message);
        pdfViewer.close();
      },
      
      close: () => {
        elements.pdfViewer.modal.classList.remove('active');
        if (state.pdf.doc) {
          state.pdf.doc.destroy();
          state.pdf.doc = null;
        }
      },
      
      download: () => {
        if (!state.pdf.currentUrl) return;
        
        const downloadUrl = utils.getDirectPdfUrl(state.pdf.currentUrl);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = utils.sanitizeFilename(state.pdf.currentTitle);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Fallback for mobile devices
        setTimeout(() => {
          if (!document.body.contains(a)) {
            window.open(downloadUrl, '_blank');
          }
        }, 200);
      }
    };