import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";

const loadState = () => {
    try {
        const serializedState = localStorage.getItem("user");
        return serializedState ? JSON.parse(serializedState) : null;
    } catch (error) {
        console.error("Lỗi khi tải user từ localStorage:", error);
        return null;
    }
};

export const store = configureStore({
    reducer: {
        user: userReducer,
    },
    user: loadState() ? { user: loadState() } : { user: null }
});
