# photomnemonic-hapi

[Mozilla Photomnemonic AWS Lambada](https://github.com/mozilla/photomnemonic) without the AWS Lambada

# what is this?

This is a rewritten version of the photomnemonic server.

Instead of using aws lambada chrome & chrome-remote-interface, we use puppeteer (in nixOS chromium+puppeteer).

# how to use?

First create a `config.yaml`

```yaml
hapi:
  port: 1234 # choose your own and put it behind a reverse proxy
```

Then run the server `node src/bin.js`

(for production `npm i -g photomnemonic-hapi` and store config in `/etc/photomnemonic.yaml`)

# nixOS

We support nixOS!

Add it to your flake like so

```
inputs.photomnemonic.url = "github:mkg20001/photomnemonic-hapi/master";
```

And use the module

```
{ ... , photomnemonic }:
  ...
  modules = [
    photomnemonic.nixosModules.photomnemonic
    ({ ... }: {
      nixpkgs.overlays = [ photomnemonic.overlay ];
      services.photomnemonic.enable = true;
    })
  ];
  ...
```
