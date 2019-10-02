/* -- A listener to ensure the fonts we need to use have been loaded */

/* --

if (document.documentElement.className.indexOf( "fonts-loaded" ) < 0 ) {

      var RalewayReg = new FontFaceObserver("raleway", {
          weight: 400,
      });

      var RalewayBold = new FontFaceObserver("raleway", {
          weight: 700,
      });

      Promise.all([
          RalewayReg.load(),
          RalewayBold.load()
      ]).then(function() {

        document.documentElement.className += " fonts-loaded";
        Cookie.set('fonts-loaded', 1, { expires: '7D', secure: true });

      });
}

*/
