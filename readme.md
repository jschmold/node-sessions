# node-sessions -- @jschmold/sessions

## Aim
To create a user-session minilib that handles user sessions

## How does it work?
Guessing one long string can be pretty hard, but what if an attacker gets it right? They'd only have to generate a single string and they'd be in.
Even worse, what happens if a single-key session string is compromised?

This library handles sessions by requiring an end-user to know two things. They must know their persistent session id, and they must know their 
transient id. The persistent session id is how you'd go about recognizing a specific device, or a session in general. The transient is how you 
know that the user is actually the one doing the requests. Every time the user makes a request, you should call the `next` function on the 
session, save the new token, and inform the user what their new session token is. The session token string contains multiple pieces of data,
adding to the overall authentication. If one piece of data is lost, it's not a valid session and the user must log in again.

## How to use this library

If you are using strings across everything, this mini-lib is plug and play.

```
let myUserSession = new Session('the_users_id');
```

If you are looking to save a session, do something like this

```
sessionId = myUserSession.sessionToken;
```

If you are looking to validate a session

```
myUserSession.validate(inputUserId, inputSessionTokenString); // returns true or false
// if validated, do this
myUserSession.next();
// save new token in database
// return token to user
```

## What about userIds of different kinds?

This one's pretty easy. This is assuming you're using ObjectID

```
function idCompare(item1: ObjectID, item2: ObjectID) {
  return item1.toHexString() === item2.toHexString();
}
Session.setIdComparator(idCompare);
```

## What if I am paranoid and want to have longer transient/persistent ids for my token?

This one is also pretty easy.

To set the transient id generator `DToken.setTransientGenerator(yourStringGenerator)`, and to set the persistent: `DToken.setPersistentGenerator(yourStringGenerator)`.

## How do I generate documentation?

Run `npm i -g typedoc`, then `npm run gendocs`
