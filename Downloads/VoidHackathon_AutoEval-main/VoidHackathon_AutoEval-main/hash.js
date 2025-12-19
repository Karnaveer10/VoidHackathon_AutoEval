import bcrypt from "bcrypt";

const plainPassword = "123456"; // your plain-text password
const saltRounds = 10; // standard is 10

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Hashed password:", hash);
});
