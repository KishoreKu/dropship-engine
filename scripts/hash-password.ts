import { hashPassword } from '../src/utils/password';

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run hash-password -- '<password>'");
  process.exit(1);
}

hashPassword(password).then(
  (hash) => console.log(hash),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
