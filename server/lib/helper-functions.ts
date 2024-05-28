export const getEnv = (varName: string) => {
  const val = process.env[varName];
  if (!!!val) {
    throw new Error(`${varName} is empty`);
  }
  return val!;
};
