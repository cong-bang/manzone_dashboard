/* eslint-disable react/prop-types */
import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/authService";
import { useDispatch } from "react-redux";
import { loginUser } from "../../redux/userSlice";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
      const response = await login(data);
      console.log(response);
      if (response && response.token.accessToken) {
        const token = response.data.token;
        const decodedToken = jwtDecode(token);

        const user = {
          token,
          id: decodedToken.sub,
          username: decodedToken.email,
          email: decodedToken.email,
          role: decodedToken.scope,
        };

        dispatch(loginUser({ user }));
        toast.success("Đăng nhập thành công!");

        if (user.role === "CUSTOMER") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.error("Đăng nhập thất bại! Kiểm tra lại thông tin đăng nhập.");
      }
    } catch (error) {
      console.log(error);
      toast.error("Thông tin đăng nhập không đúng!");
    }
  };

  return (
    <div>
      <h2>Đăng nhập</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Username */}
        <div>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            {...register("username", {
              required: "Tên đăng nhập không được để trống",
            })}
          />
          {errors.username && <p>{errors.username.message}</p>}
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            placeholder="Mật khẩu"
            {...register("password", {
              required: "Mật khẩu không được để trống",
            })}
          />
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
};

export default Login;
