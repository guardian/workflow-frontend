{ sources ? import ./nix/sources.nix }:
let
  pkgs = import sources.nixpkgs { };
  guardianNix = builtins.fetchGit {
    url = "git@github.com:guardian/guardian-nix.git";
    ref = "refs/tags/v1";
  };
  guardianDev = import "${guardianNix.outPath}/guardian-dev.nix" pkgs;

  sbtWithJava11 = pkgs.sbt.override { jre = pkgs.corretto11; };

  yarnWithNode22 = pkgs.yarn.override { nodejs = pkgs.nodejs_22; };

  yarnBuildDev = pkgs.writeShellApplication {
    name = "yarn-build-dev";
    runtimeInputs = [ yarnWithNode22 ];
    text = ''
      yarn
      yarn build-dev
    '';
  };

  sbtRun = pkgs.writeShellApplication {
    name = "sbt-run";
    runtimeInputs = [ sbtWithJava11 ];
    text = ''
      sbt "-Dconfig.file=$HOME/.gu/workflow-frontend-application.local.conf" run
    '';
  };

in guardianDev.devEnv {
  name = "workflow-frontend";
  commands = [ yarnBuildDev sbtRun ];
  extraInputs = [ sbtWithJava11 pkgs.metals ];
}
