import { deleteObject, getDownloadURL, getStorage, listAll,ref as storageRef, uploadBytes } from 'firebase/storage';

export const uploadBlogImage = async (postId: string, file: File) => {
  const storage = getStorage();
  const id = `${Date.now()}-${file.name}`;
  const path = `blog/images/${postId}/${id}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, file);
  const url = await getDownloadURL(sref);
  return { id, postId, url, storagePath: path, uploadedAt: new Date().toISOString() };
};

export const deleteBlogImage = async (storagePath: string) => {
  const storage = getStorage();
  const sref = storageRef(storage, storagePath);
  await deleteObject(sref);
};
