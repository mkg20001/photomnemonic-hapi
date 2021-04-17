{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.photomnemonic;
  photomnemonic = pkgs.photomnemonic;
in
{
  options = {
    services.photomnemonic = {
      enable = mkEnableOption "photomnemonic server";

      port = mkOption {
        description = "Port to listen at";
        type = types.int;
        default = 35331;
      };

      openFirewall = mkOption {
        type = types.bool;
        default = false;
        description = "Open ports in the firewall for photomnemonic.";
      };
    };
  };

  config = mkIf (cfg.enable) {
    networking.firewall = mkIf cfg.openFirewall {
      allowedTCPPorts = [ cfg.port ];
    };

    systemd.services.photomnemonic = with pkgs; {
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      requires = [ "network-online.target" ];

      description = "photomnemonic server";

      environment.CONFIG = with builtins; toFile "config.json" toJSON ({
        hapi.port = cfg.port;
      });

      serviceConfig = {
        Type = "simple";
        DynamicUser = true;
        ReadWritePaths = if cfg.tmpFolder != null then cfg.tmpFolder else "";
        ExecStart = "${photomnemonic}/bin/photomnemonic";
      };
    };
  };
}
