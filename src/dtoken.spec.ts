import { IDToken, DToken } from './dtoken';
import { InvalidFormatError } from './errors';
import { randomStringGenerator } from './utils';
import { assert } from 'chai';
import "mocha";

describe('DToken', function() {
  describe('[static]fromString', function() {
    it('can generate a DToken from a valid string', function() {
      let token = DToken.fromString('abc_def');  
      assert.equal(token.persistent, 'abc', 'Persistent token did not parse properly');
      assert.equal(token.transient, 'def', 'Transient token did not parse properly');
    });
    it('can generate a DToken with a created date', function() {
      let date = new Date(1535454879537);
      let token = DToken.fromString(`abc_def:${date.valueOf()}`);
      assert.equal(token.created.valueOf(), date.valueOf(), 'Did not parse created correctly');
    })
    it('can generate a DToken with a created and updated date', function() {
      let createdDate = new Date(1535454879537);
      let updatedDate = new Date();
      let token = DToken.fromString(`abc_def:${createdDate.valueOf()}_${updatedDate.valueOf()}`);
      assert.equal(token.created.valueOf(), createdDate.valueOf(), 'Did not parse created correctly');
      assert.equal(token.lastUpdated.valueOf(), updatedDate.valueOf(), 'Did not parse updatedDate correctly');
    })

    it('throws appropriate error if created date is invalid', function() {
      let errored = false;
      try {
        DToken.fromString('abc_def:jlkjlkjljl');
      } catch (err) {
        assert.isNotNull(
          /created/i.exec(err.toString()),
          `Error did not indicate created date was the problem: ${err}`
        );
        errored = true;
      }
      assert.isTrue(errored, 'Did not throw an error, but expected a created date error');
    })
    it('throws appropriate error if updated date is invalid', function() {
      let errored = false;
      try {
        DToken.fromString('abc_def:1535454879537_jlkjlkjljl');
      } catch (err) {
        assert.isNotNull(
          /updated/i.exec(err.toString()),
          `Error did not indicate updated date was the problem: ${err}`
        );
        errored = true;
      }
      assert.isTrue(errored, 'Did not throw an error, but expected an updated date error');
    })
    it('throws InvalidFormatError if invalid string provided', function() {
      let errored = false;
      try {
        let token = DToken.fromString('abc:def:333:333');
      } catch (err) {
        assert.isDefined(/expected format/i.exec(err.toString()), `Threw incorrect type of error: ${err}`);
        errored = true;
      }

      assert.isTrue(errored, 'Expected a format error, but got no error');
    });
  })
  describe('#next', function() {
    afterEach(() => {
      DToken.setTransientGenerator(randomStringGenerator);
      DToken.setPersistentGenerator(randomStringGenerator);
    })
    it('generates a new transient', function() {
      let tok = new DToken();
      let old = tok.transient;
      tok.next();

      assert.notEqual(old, tok.transient, 'Did not generate a new transient token');
    })

    it('generates a new transient using provided generator', function() {
      let calls = false;
      let transient = function() {
        calls = true;
        return randomStringGenerator();
      }
      DToken.setTransientGenerator(transient);
      let tok = new DToken();
      tok.next();
      assert.isTrue(calls, 'Did not call provided generator');
    })

    it('returns the old transient token', function() {
      let tok = new DToken(),
          old = tok.transient,
         test = tok.next();
      assert.equal(old, test, 'Did not return old token');
    })
  })
  describe('#validate', function() {
    let token = new DToken();

    it('validates transient field', function() {
      let failObj = DToken.fromObject(token);
      failObj.transient = randomStringGenerator();
      let passObj = DToken.fromObject(token);

      assert.isFalse(token.validate(failObj), `${failObj.transient} vs ${token.transient}`);
      assert.isTrue(token.validate(passObj), `${passObj.transient} vs ${token.transient}`);
    })

    it('validates persistent field', function() {
      let failObj = DToken.fromObject(token);
      failObj.persistent = randomStringGenerator();
      let passObj = DToken.fromObject(token);

      assert.isFalse(token.validate(failObj), `${failObj.persistent} vs ${token.persistent}`);
      assert.isTrue(token.validate(passObj), `${passObj.persistent} vs ${token.persistent}`);
    })

    it('validates lastUpdated field', function() {
      let failObj = DToken.fromObject(token);
      failObj.lastUpdated = new Date(new Date().valueOf() + 1000);
      let passObj = DToken.fromObject(token);

      assert.isFalse(token.validate(failObj), `${failObj.lastUpdated.valueOf()} vs ${token.lastUpdated.valueOf()}`);
      assert.isTrue(token.validate(passObj), `${passObj.lastUpdated.valueOf()} vs ${token.lastUpdated.valueOf()}`);
    })

    it('validates created field', function() {
      let failObj = DToken.fromObject(token);
      failObj.created = new Date(new Date().valueOf() + 1000);
      let passObj = DToken.fromObject(token);

      assert.isFalse(token.validate(failObj), `${failObj.created.valueOf()} vs ${token.created.valueOf()}`);
      assert.isTrue(token.validate(passObj), `${passObj.created.valueOf()} vs ${token.created.valueOf()}`);
    })
  });
  describe('#validateString', function() {
    let token = new DToken();
    it('validates against a correct string', function() {
      let { persistent, transient, created, lastUpdated } = token;
      let str = `${persistent}_${transient}:${created.valueOf()}_${lastUpdated.valueOf()}`;
      assert.isTrue(token.validateString(str), 'Did not validate against a correct string');
    })

    it('fails against an incorrect string', function() {
      let { persistent, transient, created, lastUpdated } = token;
      let str = `${persistent}_${transient}:${lastUpdated.valueOf()}|${created.valueOf()}`;
        assert.isFalse(token.validateString(str), 'Validated against an incorrect string');
    })
  });
});
