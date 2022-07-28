export interface INavData {
  name?: string;
  url?: string | any[];
  href?: string;
  icon?: string;
  title?: boolean;
  children?: INavData[];
  variant?: string;
  divider?: boolean;
  class?: string;
}
