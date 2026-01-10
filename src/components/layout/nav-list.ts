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
    link: "/https://dub.sh/tax-yasef/learn",
    label: "Learn",
    icon: "mdi:book",
  },
  // {
  //   dialog: "newsletter",
  //   label: "Newsletter",
  //   icon: "mdi:email",
  // },
  // {
  //   link: "/shop",
  //   label: "Shop",
  //   icon: "mdi:shopping",
  // },
  {
    dialog: "about",
    label: "About",
    icon: "mdi:information-outline",
  },
  {
    link: "https://selfservice.nrs.gov",
    label: "File Tax",
    icon: "mdi:file-document",
  },
  {
    link: "https://tally.so/r/obeJrN",
    label: "Request a feature",
    icon: "mdi:plus",
  },
];
