module.exports = configSelector => {
  if (configSelector === "husky") {
    return objectConfig => ({
      hooks: {
        // tag::pre-commit[]
        "pre-commit": "pretty-quick --staged && eslint . --fix",
        // end::pre-commit[]
        ...objectConfig,
      }
    });
  } else if (configSelector === "prettier") {
    return {
      singleQuote: true,
      semi: true,
      tabWidth: 2,
      printWidth: 120
    };
  }
};
