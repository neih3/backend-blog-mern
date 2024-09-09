const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dwqhdckgn",
  api_key: "534121825367875",
  api_secret: "3rZOId_pqs3Iy8YQ7R0ShHiFIJE",
});

exports.uploads = (file, folder) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
        folder: folder,
      });

      resolve({ url: result.url, id: result.public_id });
    } catch (error) {
      reject(error);
    }
  });
};
