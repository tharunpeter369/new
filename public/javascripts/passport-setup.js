const passport = require('passport')
const GoogleStrategy= require('passport-google-oauth2').Strategy
const facebookStrategy = require('passport-facebook').Strategy


passport.serializeUser(function(user, done) {
    /*
    From the user take just the id (to minimize the cookie size) and just pass the id of the user
    to the done callback
    PS: You dont have to do it like this its just usually done like this
    */
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
    /*
    Instead of user this function usually recives the id 
    then you use the id to select the user from the db and pass the user obj to the done callback
    PS: You can later access this data in any routes in: req.user
    */
    done(null, user);
});


passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback:true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile)
    // userprofile=profile
    return done(null, profile);
  }
));


passport.use(new facebookStrategy({

  // pull in our app id and secret from our auth.js file
  clientID        : "174317747963414",
  clientSecret    : "3b0598d0de66b1f3afe4dbec95762f2c",
  callbackURL     : "http://localhost:3000/facebook/callback",
  profileFields   :['id','displayName','name','gender','picture.type(large)','email']
},// facebook will send back the token and profile
function(token, refreshToken, profile, done) {
  console.log(profile)
  return done(null,profile)
}));


