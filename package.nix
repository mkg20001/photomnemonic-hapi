{ stdenv
, lib
, drvSrc ? ./.
, mkNode
, nodejs-16_x
, makeWrapper
, chromium
}:

mkNode {
  root = drvSrc;
  nodejs = nodejs-16_x;
  production = false;
  packageLock = ./package-lock.json;
} {
  buildInputs = [
    chromium
  ];

  nativeBuildInputs = [
    makeWrapper
  ];

  prePatch = ''
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
  '';

  shellHook = ''
    export PUPPETEER_EXECUTABLE_PATH=${chromium.outPath}/bin/chromium
  '';

  preFixup = ''
    for bin in $out/bin/*; do
      wrapProgram $bin \
        --set PUPPETEER_EXECUTABLE_PATH ${chromium.outPath}/bin/chromium
    done
  '';
}
