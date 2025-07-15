import { axiosInstance } from "../apiConfig";

export async function login(data) {
  try {
    const response = await axiosInstance.post("auth/login", data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return { error: "Thông tin đăng nhập không đúng!" };
    }
    return error.message;
  }
}
