const config = {
  extends: ["stylelint-config-standard"],
  rules: {
    "selector-class-pattern":
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null,
    "rule-empty-line-before": null,
    "at-rule-empty-line-before": null,
    "media-feature-range-notation": null,
    "font-family-no-missing-generic-family-keyword": null,
  },
};

export default config;
