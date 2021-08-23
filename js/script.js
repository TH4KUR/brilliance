"use-strict";
// UPDATE Subject Report Elements
let report_btn = document.getElementById("report-modal-btn");
let update_btn = document.getElementById("update-report");
let report_modal = document.getElementById("report-modal");
let info_text2 = document.getElementById("info_text-2");
let success_text2 = document.getElementById("success_text-2");
let err_text2 = document.getElementById("err_text-2");
let modal_bg = document.getElementsByClassName("modal-backdrop");
let close_report = Array.from(document.querySelectorAll(".close-report"));

let success_friend = document.getElementById("success-friend");
let btn_friend = document.getElementById("btn-add-friend");
let friend_modal = document.getElementById("friend-modal");
let err_friend = document.getElementById("err-friend");
let friend_input = document.getElementById("friend-code");
let friend_btn_add = document.getElementById("add-friend");
let close_friend = Array.from(document.querySelectorAll(".close-friend"));

let logout_btns = Array.from(document.querySelectorAll(".logout_btn"));

let enter_eng = document.getElementById("enter-eng");
let enter_hin = document.getElementById("enter-hin");
let enter_math = document.getElementById("enter-math");
let enter_sci = document.getElementById("enter-sci");
let enter_sst = document.getElementById("enter-sst");
let body = document.querySelector("body");

function eraseCookieFromAllPaths(name) {
  // This function will attempt to remove a cookie from all paths.
  var pathBits = location.pathname.split("/");
  var pathCurrent = " path=";

  // do a simple pathless delete first.
  document.cookie = name + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT;";

  for (var i = 0; i < pathBits.length; i++) {
    pathCurrent += (pathCurrent.substr(-1) != "/" ? "/" : "") + pathBits[i];
    document.cookie =
      name + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT;" + pathCurrent + ";";
  }
}

const closeModal = (modal) => {
  return function () {
    modal.classList.remove("show");
    modal.classList.remove("modal-styles-unique");
    body.classList.remove("modal-open");
    body.style.paddingRight = "0px";
    document.getElementById("modal-bg-remove").remove();
  };
};
////////////////////////////////////////////////////
// ADD A FRIEND
btn_friend.addEventListener("click", async (e) => {
  e.preventDefault();
  console.log("click");
  body.classList.add("modal-open");
  body.style.paddingRight = "17px";
  document
    .querySelector("body")
    .insertAdjacentHTML(
      "beforeEnd",
      `<div id="modal-bg-remove" class="modal-backdrop fade show"></div>`
    );
  friend_modal.classList.add("show");
  friend_modal.classList.add("modal-styles-unique");
});

friend_btn_add.addEventListener("click", async (e) => {
  try {
    let fcode = friend_input.value;
    if (!fcode) throw new Error("Please enter a friend code");
    let data = {
      friendCode: fcode,
    };
    let res = await fetch("/addfriend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    let json_res = await res.json();
    console.log(json_res);
    if (!res.ok) {
      let err = new Error(json_res.message);
      throw err.message;
    }
    err_friend.classList.add("hidden");
    success_friend.classList.remove("hidden");
    // setTimeout(() => {
    //   location.reload();
    // }, 1500);
  } catch (err) {
    console.log(err);
    err_friend.textContent = err;
    err_friend.classList.remove("hidden");
  }
});

close_friend.forEach((btn) => {
  let close = closeModal(friend_modal);
  btn.addEventListener("click", close);
});

/////////////////////////////////////////////////////
// Update report
update_btn.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    let form_values = [
      enter_eng.value,
      enter_hin.value,
      enter_math.value,
      enter_sci.value,
      enter_sst.value,
    ];
    var count = 0;
    var checkpass = true;
    form_values.forEach((val) => {
      if (+val > 100 || +val < 30) {
        let error_msg = new Error(
          "Percentage Cannot be greater than 100 or less than 30"
        );
        checkpass = false;
        throw error_msg.message;
      } else {
        if (count >= 3) {
          let error_msg = new Error(
            `Brilliance is completely based on its user's honesty. \n Are you sure you are not lying? 😕`
          );
          checkpass = false;
          throw error_msg.message;
        } else if (val == 100) {
          count++;
          console.log(count);
        }
      }
    });
    if (checkpass) {
      let data = {
        update: {
          sub_report: {
            eng: +enter_eng.value,
            hin: +enter_hin.value,
            math: +enter_math.value,
            sci: +enter_sci.value,
            sst: +enter_sst.value,
          },
        },
      };
      let res = await fetch("/dashboard", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      let json_res = await res.json();
      console.log(json_res);
      if (!res.ok) {
        let err = new Error(json_res.message);
        throw err.message;
      }
      err_text2.classList.add("hidden");
      success_text2.classList.remove("hidden");
      info_text2.classList.add("hidden");
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    console.log(err);
    err_text2.textContent = err;
    if (err.includes("5 secs")) {
      err_text2.classList.remove("hidden");
      setTimeout(() => location.reload(), 5000);
    } else if (err.includes("lying?")) {
      err_text2.classList.add("hidden");
      success_text2.classList.add("hidden");
      info_text2.textContent = err;
      info_text2.classList.remove("hidden");
    } else {
      err_text2.classList.remove("hidden");
    }
  }
});

close_report.forEach((btn) => {
  let close = closeModal(report_modal);
  btn.addEventListener("click", close);
});

report_btn.addEventListener("click", async (e) => {
  e.preventDefault();
  body.classList.add("modal-open");
  body.style.paddingRight = "17px";
  body.insertAdjacentHTML(
    "beforeEnd",
    `<div id="modal-bg-remove" class="modal-backdrop fade show"></div>`
  );
  report_modal.classList.add("show");
  report_modal.classList.add("modal-styles-unique");
  // report_modal.
  console.log("click");
});

logout_btns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    eraseCookieFromAllPaths("token");
    location.reload();
  });
});
