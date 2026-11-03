const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/hospital-queue", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedUsers = async () => {
  try {
    await User.deleteMany();

    const users = [
      {
        name: "Admin User",
        email: "admin@gmail.com",
        password: "123456",
        role: "admin",
      },
      {
        name: "Doctor User",
        email: "doctor@gmail.com",
        password: "123456",
        role: "doctor",
      },
      {
        name: "Patient User",
        email: "patient@gmail.com",
        password: "123456",
        role: "patient",
      },
    ];

    for (const user of users) {
      await User.create(user); // ✅ triggers hashing
    }

    console.log("✅ Users seeded successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();