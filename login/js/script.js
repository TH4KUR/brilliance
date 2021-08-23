"use-strict";
let btn_submit = document.getElementById("submit");

btn_submit.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let success_box = document.querySelector(".success");

    if (!email || !password) return;

    data = {
      password: password,
      email: email,
    };

    let res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let json_res = await res.json();
      throw new Error(
        json_res.message ||
          "An error occurred, please check your given input and try again."
      );
    } else {
      success_box.classList.remove("hidden");
      setTimeout(() => (window.location = "/dashboard"), 1500);
    }
  } catch (err) {
    console.log(err);
    let err_box = document.querySelector(".failed");
    err_box.textContent = err || err.message;
    err_box.classList.remove("hidden");
    setTimeout(() => err_box.classList.add("hidden"), 3000);
  }
});
