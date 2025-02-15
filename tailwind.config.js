export default {
  content: ["./index.html", "./app/**/*.tsx"],
  theme: {
    fontSize: {
      xxs: "0.5rem",
      xs: "0.6875rem",
      sm: "0.8125rem",
      base: "0.9375rem",
      lg: "1.125rem",
      xl: "1.250rem",
      "2xl": "1.5rem",
      "3xl": "2rem",
    },
    extend: {
      boxShadow: {
        button:
          "inset 0 1px rgba(240, 240, 240, 0.2), inset 0 -1px rgba(0, 0, 0, 0.4), inset -1px 0px rgba(0, 0, 0, 0.4), inset 1px 0px rgba(240, 240, 240, 0.2)",
        menu: "inset 0 2px rgba(240, 240, 240, 0.2), inset 0 -2px rgba(0, 0, 0, 0.4), inset -1px 0px rgba(0, 0, 0, 0.4), inset 1px 0px rgba(240, 240, 240, 0.2)",
      },
      dropShadow: {
        modal: "0 1px 25px rgba(240, 240, 240, 0.05)",
      },
      fontFamily: {
        sans: "Noto Sans",
      },
    },
  },
  plugins: [],
};
