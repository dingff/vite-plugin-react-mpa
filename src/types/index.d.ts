export type EntryObject = {
  [k: string]: string;
};

export type Options = {
  template?: string;
  mountElementId?: string;
  globalImport?: string[];
  lowerCase?: boolean;
  layout?: string;
}
