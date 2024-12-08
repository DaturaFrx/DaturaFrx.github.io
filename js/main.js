const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const output = document.getElementById("output");
const uploadedImage = document.getElementById("uploadedImage");
const linkContainer = document.getElementById("linkContainer");
const imageLink = document.getElementById("imageLink");
const copyBtn = document.getElementById("copyBtn");

// Compress image if it exceeds 20MB
const compressImage = async (file) => {
  const maxFileSize = 20 * 1024 * 1024; // 20MB
  if (file.size <= maxFileSize) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > 1920) {
            height *= 1920 / width;
            width = 1920;
          }
        } else {
          if (height > 1920) {
            width *= 1920 / height;
            height = 1920;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob.size <= maxFileSize) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              canvas.toBlob(
                (blob2) => {
                  resolve(new File([blob2], file.name, { type: "image/jpeg" }));
                },
                "image/jpeg",
                0.7
              ); // Adjust quality here
            }
          },
          "image/jpeg",
          0.9
        );
      };
    };
    reader.readAsDataURL(file);
  });
};

const generateSafeFilename = (originalFilename) => {
  const timestamp = Date.now();
  const safeFilename = originalFilename.replace(/[^a-zA-Z0-9]/g, "_");
  return `${timestamp}_${safeFilename}`;
};

const uploadImage = async (file) => {
  const safeFilename = generateSafeFilename(file.name);
  const storageRef = ref(storage, `images/${safeFilename}`);
  try {
    const compressedFile = await compressImage(file);
    const snapshot = await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);

    output.textContent = "Image uploaded successfully!";
    imageLink.href = downloadURL;
    imageLink.textContent = "Click here to view the image";
    linkContainer.style.display = "flex";
    uploadedImage.src = downloadURL;
    uploadedImage.style.display = "block";

    // Save deletion time (12 hours later)
    const deleteTime = Date.now() + 12 * 60 * 60 * 1000;
    const imageKey = storageRef.fullPath.replace(/\//g, "-");
    await set(dbRef(db, `images/${imageKey}`), {
      url: downloadURL,
      deleteAt: deleteTime,
    });

    // Schedule deletion in 12 hours
    setTimeout(async () => {
      await deleteObject(storageRef);
      await remove(dbRef(db, `images/${imageKey}`));
      output.textContent = "Image has been deleted after 12 hours.";
      uploadedImage.style.display = "none";
      linkContainer.style.display = "none";
    }, 12 * 60 * 60 * 1000);
  } catch (error) {
    output.textContent = `Error uploading or compressing image: ${error}`;
    console.error("Upload error:", error);
  }
};

uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (file) {
    uploadImage(file);
  } else {
    output.textContent = "Please select an image.";
  }
});

const dropZone = document.querySelector("div.flex.items-center.justify-center");

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
  dropZone.classList.add("bg-gray-700");
}

function unhighlight() {
  dropZone.classList.remove("bg-gray-700");
}

dropZone.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const file = dt.files[0];
  fileInput.files = dt.files;
  if (file) {
    uploadImage(file);
  }
}

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(imageLink.href).then(
    () => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    },
    (err) => {
      console.error("Could not copy text: ", err);
    }
  );
});
