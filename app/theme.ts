import { Combobox, createTheme, Menu, Modal, MultiSelect, Select, rem } from "@mantine/core";
export const theme = createTheme({
  primaryColor: "teal",
  colors: {},
  fontSizes: {
    xs: rem(11),
    sm: rem(12),
    md: rem(14),
    lg: rem(16),
    xl: rem(18),
  },
  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.44)",
    sm: "0 2px 4px rgba(0, 0, 0, 0.48)",
    md: "0 4px 10px rgba(0, 0, 0, 0.42)",
    lg: "0 8px 18px rgba(0, 0, 0, 0.56)",
    xl: "0 12px 28px rgba(0, 0, 0, 0.60)",
  },

  headings: {
    sizes: {
      h1: { fontWeight: "700", fontSize: rem(30), lineHeight: "1.4" },
      h2: { fontWeight: "700", fontSize: rem(18), lineHeight: "1.25" },
      h3: { fontWeight: "700", fontSize: rem(16), lineHeight: "1.1" },
    },
  },
  components: {
    Menu: Menu.extend({ defaultProps: { shadow: "md" } }),
    Modal: Modal.extend({ defaultProps: { shadow: "md", centered: true } }),
    Select: Select.extend({ defaultProps: { comboboxProps: { shadow: "md" } } }),
    MultiSelect: MultiSelect.extend({ defaultProps: { comboboxProps: { shadow: "md" } } }),
    Combobox: Combobox.extend({ defaultProps: { shadow: "md" } }),
    InputWrapper: {
      styles: {
        label: {
          lineHeight: "1.0",
          marginBottom: rem(0),
          fontSize: rem(12),
          color: "var(--mantine-color-gray-7)",
        },
      },
    },
  },
});
