const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const TIMEOUT_REPORT = 15;
const TIMEOUT_OVERALL = 30;
// Middlewares

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

////////////////////////////////////////////
// Helper functions

const get_friend_info = async (fcodes_arr) => {
  let friend_info = fcodes_arr.map(
    async (fcode) => await User.findOne({ friendCode: { $eq: fcode } })
  );
  let resolved = await Promise.all(friend_info);

  return resolved;
};

const token_validate = async (req) => {
  let [u, p] = req.cookies.token
    .split(":")
    .map((el) => Buffer.from(el, "base64").toString("utf-8"));
  let user = await User.findOne({
    $and: [{ username: { $eq: u } }, { password: { $eq: p } }],
  });
  console.log(user);
  return user ? { user, check: true } : { check: false };
};
const token_checker = async (req, res) => {
  if (req.cookies.token && req.cookies.token.split(":").length === 2) {
    let { check } = token_validate(req, res);
    if (!check) {
      res.writeHead(301, { Location: "/login" }).end();
      return;
    }
    res.writeHead(301, { Location: "/dashboard" }).end();
    return;
  } else {
    res.writeHead(301, { Location: "/login" }).end();
    return;
  }
};
let dic = {
  eng: "English",
  hin: "Hindi",
  math: "Maths",
  sci: "Science",
  sst: "Social Science",
};
function differenceDate(date1, date2) {
  let date1f = new Date(date1);
  let date2f = new Date(date2);
  if (date1f < date2) return 31;
  console.log(date1f, date2f);
  day = 1000 * 60 * 60 * 24;
  return +Math.floor((date2f.getTime() - date1f.getTime()) / day);
}

dotenv.config({ path: "./config.env" });

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log("DB connection successful");
  });

const validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: String,
  username: {
    type: String,
    required: [true, "This is a required field - Username"],
    unique: [true, "This username is already taken."],
  },
  password: {
    type: String,
    required: [true, "This is a required field - password"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: [true, "This email is already registered"],
    required: [true, "Email address is required"],
    validate: [validateEmail, "Please fill a valid email address"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  friendCode: {
    type: String,
  },
  friends: Array,
  sub_report: {
    type: Object,
    required: [true, "500 internal server error"],
  },
  overall_report: {
    type: Object,
    required: [true, "500 internal server error"],
  },
  firstLogin: {
    type: Boolean,
    required: [true, "500 internal server error"],
  },
});

const User = mongoose.model("Users", userSchema);

app.listen(80, () => {
  console.log("App running on port 80......");
});

app.use(express.static(`${__dirname}`));

const dashboard_temp = fs.readFileSync(
  `${__dirname}/Main page/index.html`,
  "utf-8"
);
const organize_temp = fs.readFileSync(
  `${__dirname}/Main page/blank.html`,
  "utf-8"
);
const templateUser = async (temp, user, dashboard = false) => {
  let output = temp.repeat(1);
  if (!dashboard) {
    let sub_arr = Object.entries(user.sub_report);
    let min_marks = sub_arr.slice(0, -1).findIndex((arr) => {
      return (
        arr[1] === Math.min(...Object.values(user.sub_report).slice(0, -1))
      );
    });
    let max_marks = sub_arr.slice(0, -1).findIndex((arr) => {
      return (
        arr[1] === Math.max(...Object.values(user.sub_report).slice(0, -1))
      );
    });
    let w_sub = dic[sub_arr[min_marks][0]];
    let s_sub = dic[sub_arr[max_marks][0]];
    console.log("MIN", w_sub);
    console.log("MAX", s_sub);
    output = output.replace(
      /{weakest_sub}/g,
      w_sub
        ? w_sub
        : "This data will be updated once you update you subject report"
    );
    output = output.replace(
      /{strong_sub}/g,
      s_sub
        ? s_sub
        : "This data will be updated once you update you subject report"
    );
  }
  output = output.replace(/{eng_report}/g, user.sub_report.eng);
  output = output.replace(/{hin_report}/g, user.sub_report.hin);
  output = output.replace(/{math_report}/g, user.sub_report.math);
  output = output.replace(/{sci_report}/g, user.sub_report.sci);
  output = output.replace(/{sst_report}/g, user.sub_report.sst);
  output = output.replace(/{Username}/g, user.username);
  output = output.replace(/{first_name}/g, user.first_name);
  output = output.replace(/{FRIEND_CODE}/g, user.friendCode);
  output = output.replace(/{e1}/g, user.overall_report.e1);
  output = output.replace(/{e2}/g, user.overall_report.e2);
  output = output.replace(/{e3}/g, user.overall_report.e3);
  output = output.replace(/{e4}/g, user.overall_report.e4);
  output = output.replace(/{e5}/g, user.overall_report.e5);
  output = output.replace(/{final}/g, user.overall_report.f);
  let f_template = `
<h4 class="small font-weight-bold">{friend_name}
  <span class="float-right">{overall_p}%</span>
</h4>
<div class="progress mb-4">
  <div
    class="progress-bar bg-{COLOR}"
    role="progressbar"
    style="width:{overall_p}%"
    aria-valuenow="20"
    aria-valuemin="0"
    aria-valuemax="100">
  </div>
</div>`;
  if (dashboard === true && user.friends.length >= 1) {
    // f_template = f_template.replace("{overall_p}", "10");

    let x = await get_friend_info(user.friends);
    // console.log(x);
    let y = x.map((f) => {
      let temp = [...f_template].join("");
      temp = temp.replace(/{overall_p}/g, f.overall_report.e1);
      temp = temp.replace(/{COLOR}/g, "secondary");
      temp = temp.replace(/{friend_name}/g, `${f.first_name} ${f.last_name}`);
      return temp;
    });
    let loginUser_temp = f_template.repeat(1);
    loginUser_temp = loginUser_temp.replace(
      /{overall_p}/g,
      user.overall_report.e1
    );
    loginUser_temp = loginUser_temp.replace(/{COLOR}/g, "primary");
    loginUser_temp = loginUser_temp.replace(/{friend_name}/g, `You`);

    y.unshift(loginUser_temp);
    output = output.replace(/{FRIENDS_REP}/g, y.join(""));
    // output = output.replace(/{overall_p}/g, "80");
    output = output.replace("{DISPLAY_REP}", "");
  }
  output = output.replace("{DISPLAY_REP}", "hidden");
  return output;
};

app
  .route("/login")
  .get((req, res) => {
    res.status(200).sendFile(`${__dirname}/login/index.html`);
  })
  .post(async (req, res) => {
    try {
      let login_user = await User.findOne({
        $and: [
          { email: { $eq: req.body.email } },
          { password: { $eq: req.body.password } },
        ],
      });

      if (!login_user)
        throw new Error(
          "No user found. Please check your entered email and password and try again."
        );
      res
        .status(200)
        .cookie(
          "token",
          `${Buffer.from(login_user.username).toString("base64")}:${Buffer.from(
            login_user.password
          ).toString("base64")}`
        )
        .end();
    } catch (err) {
      console.error(err);
      res.status(400).json({
        status: "failed",
        message: err.message,
      });
    }
  });

// Sign Up ............
// app.use(express.static(`${__dirname}`));

app
  .route("/allusers")
  .get(async (req, res) => {
    let alldata = await User.find();
    res.json(alldata);
  })
  .delete(async (req, res) => {
    if (req.body.confirm === "yes") await User.deleteMany();
    res.status(200).json({
      status: "success",
      message: "All users where deleted",
    });
  });

app
  .route("/dashboard")
  .get(async (req, res) => {
    try {
      console.log(req.cookies.token);
      if (req.cookies.token && req.cookies.token.split(":").length === 2) {
        let ret_obj = await token_validate(req, res);
        let check = ret_obj.check;
        let user = ret_obj?.user;
        console.log(check);
        if (!check) {
          res.writeHead(301, { Location: "/login" }).end();
          return;
        }
        let html = await templateUser(dashboard_temp.repeat(1), user, true);
        res.writeHead(200, { "Content-Type": "text/html" }).end(html);
      } else {
        res.writeHead(301, { Location: "/login" }).end();
        return;
      }
    } catch (err) {
      console.log(err);
    }
  })
  .patch(async (req, res) => {
    try {
      if (!req.body || !req.body.update)
        throw new Error("No request body sent or no update object!");

      var now = new Date();

      // req.body.update.sub_report.timeout_till = timeout_till;
      let { user, check } = await token_validate(req, res);
      let { username, password } = user;
      if (!check)
        throw new Error(
          "An error occurred 💥!, You are being signed out in 5 secs!.., Please login again and retry"
        );
      let timeout_t = user.sub_report.timeout_till;
      let dateDiff = differenceDate(timeout_t, now);
      console.log(dateDiff);
      if (dateDiff > 30) {
        let timeout_till = new Date(now.setDate(now.getDate() + 30));
        req.body.update.sub_report.timeout_till = timeout_till.toISOString();
        let overall = {
          overall_report: {
            e1:
              (Object.values(req.body.update.sub_report).reduce(
                (acc, val, i) => {
                  if (i === 5) return (acc += 0);
                  return (acc += +val);
                },
                0
              ) /
                500) *
              100,
            e2: 0,
            e3: 0,
            e4: 0,
            e5: 0,
            f: 0,
          },
        };
        req.body.update = Object.assign(req.body.update, overall);
        console.log("body", req.body);
        user = await User.findOneAndUpdate(
          {
            $and: [
              {
                username: {
                  $eq: username,
                },
              },
              {
                password: {
                  $eq: password,
                },
              },
            ],
          },
          req.body.update,
          { returnOriginal: true }
        );

        if (!user)
          throw new Error(
            "An error occurred 💥!, You are being signed out in 5 secs!.., Please login again and retry"
          );

        res.status(200).json({
          status: "success",
          message: "The requested data was updated.",
        });
      } else {
        throw new Error(
          `You recently made an update you can make next update in ${Math.abs(
            dateDiff
          )} days.`
        );
      }
    } catch (err) {
      console.log(err);
      res.status(400).json({
        status: "failed",
        message: err.message,
      });
    }
  });
app.get("/organize", async (req, res) => {
  try {
    if (req.cookies.token && req.cookies.token.split(":").length === 2) {
      let ret_obj = await token_validate(req, res);
      let check = ret_obj.check;
      let user = ret_obj?.user;
      console.log("Hello>");
      if (!check) {
        res.writeHead(301, { Location: "/login" }).end();
      }
      let organize_html = await templateUser(organize_temp, user);
      res.status(200).end(organize_html);
    } else {
      res.writeHead(301, { Location: "/login" }).end();
    }
  } catch (err) {
    console.log(err);
  }
});
app.route("/favicon.ico").get((_, res) => {
  res.status(404).end();
});
app.route("/addfriend").post(async (req, res) => {
  try {
    let { friendCode: fcode } = req.body;
    console.log(fcode);

    let { user: login_user } = await token_validate(req);
    console.log("LOGINUSER-", login_user);
    if (!login_user)
      throw new Error(
        "Invalid auth token! You are being logged out please login and try again!"
      );
    let u2 = await User.findOne({ friendCode: { $eq: fcode } });
    if (!u2) {
      throw new Error(
        "Invalid Friend code sent! 💥 Please check the code given and try again."
      );
    }
    if (login_user.friendCode === u2.friendCode)
      throw new Error(`You cannot add yourself as a friend.`);
    if (login_user.friends.find((el) => el === fcode))
      throw new Error(
        `The requested user ${u2.first_name} ${u2.last_name} is already your friend!`
      );
    await User.findOneAndUpdate(
      { _id: { $eq: login_user._id } },
      {
        friends: login_user.friends.concat([fcode]),
      }
    );
    await User.findOneAndUpdate(
      { friendCode: { $eq: fcode } },
      { friends: u2.friends.concat(login_user.friendCode) }
    );
    res.status(200).json({
      status: "success",
      message: `The requested user ${u2.first_name} ${u2.last_name} was added to your friend list!. Please refresh the page to see changes.`,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
});
app.use((req, res, next) => {
  if (!req.body.name) next();
  const now = new Date();
  let random = Math.trunc(Math.random() * 1000) + 737;
  let timeout_till = new Date(now.setDate(now.getDate() - 31));
  req.body.friendCode = `${req.body.username}-${random}`;
  req.body.sub_report = {
    eng: 0,
    hin: 0,
    math: 0,
    sci: 0,
    sst: 0,
    timeout_till,
  };
  req.body.overall_report = {
    e1: 0,
    e2: 0,
    e3: 0,
    e4: 0,
    e5: 0,
    f: 0,
  };
  req.body.friends = [];
  req.body.firstLogin = true;
  next();
});

app
  .route("/signup")
  .get((req, res) => {
    res.sendFile(`${__dirname}/login/signup.html`);
  })
  .post(async (req, res) => {
    try {
      if (!req.body) throw new Error("No data sent");
      let body = req.body;
      let name = body.name.split(" ");
      body.first_name = name[0];
      body.last_name = name[1];

      let userdata = new User(req.body);
      await userdata.save();

      res
        .status(200)
        .cookie(
          "token",
          `${Buffer.from(req.body.username).toString("base64")}:${Buffer.from(
            req.body.password
          ).toString("base64")}`,
          {
            maxAge: 1000 * 60 * 60 * 24, // would expire after 1 day
          }
        )
        .json({
          status: "success",
          message: "Done. Data sent by you",
          data: req.body,
        });
    } catch (err) {
      console.log("err", err);
      if (err.message.includes("dup key: { username")) {
        res.status(400).json({
          status: "failed",
          message: "This username is already taken.",
        });
        return;
      } else if (err.message.includes("dup key: { email")) {
        res.status(400).json({
          status: "failed",
          message: "This email is already registered",
        });
      } else {
        res.status(400).json({
          status: "failed",
          message: err.message,
        });
      }
    }
  });

app.get("*", function (req, res) {
  res.status(404).sendFile(`${__dirname}/Main page/404.html`);
});
