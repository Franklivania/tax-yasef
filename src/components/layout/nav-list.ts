export type NavItem =
  | {
      label: string;
      icon: string;
      link: string;
    }
  | {
      label: string;
      icon: string;
      dialog: "newsletter" | "about";
    };

export const nav_items: NavItem[] = [
  {
    link: "/learn",
    label: "Learn",
    icon: "mdi:book",
  },
  {
    dialog: "newsletter",
    label: "Newsletter",
    icon: "mdi:email",
  },
  {
    link: "/shop",
    label: "Shop",
    icon: "mdi:shopping",
  },
  {
    dialog: "about",
    label: "About",
    icon: "mdi:information-outline",
  },
];
