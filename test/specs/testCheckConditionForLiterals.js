/*
  Copyright 2019-2021 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
/* global it, describe */

const assert = require("assert"),
      testID = "CC001",
      debug = require("debug")("apigeelint:" + testID),
      bl = require("../../lib/package/bundleLinter.js"),
      Condition = require("../../lib/package/Condition.js"),
      plugin = require(bl.resolvePlugin(testID)),
      Dom = require("@xmldom/xmldom").DOMParser,
      test = function(exp, expected) {
        it(`tests whether exp(${exp}) includes a literal, expect(${expected})`,
          function() {
            let doc = new Dom().parseFromString(exp),
                c = new Condition(doc, this);

            c.addMessage = function(msg) {
              debug(msg);
            };

            plugin.onCondition(c, function(err, result) {
              assert.equal(
                err,
                undefined,
                err ? " err " : " no err"
              );
              assert.equal(
                result,
                expected,
                result ? " literal found " : "literal not found"
              );
            });
          }
        );
      };

//now generate a full report and check the format of the report

describe(`${testID} - ${plugin.plugin.name}`, function() {

  test("false", true);
  test("true", true);
  test("true OR false", true);
  test("b=1", false);
  test("b = c AND true", true);
  test("b OR c AND (a OR B AND C or D and True)", true);
  test("true and b!=c", true);
  test("b!=true", false);
  test("b=false", false);
  test("1", true);
  test('"foo"', true);
  test("request.queryparams.foo", false);
  test(
    'request.header.Content-Type = "application/json"',
    false
  );
  test(
    'request.verb = "POST" and request.header.Content-Type = "application/json"',
    false
  );

  var Bundle = require("../../lib/package/Bundle.js"),
    util = require("util"),
    bl = require("../../lib/package/bundleLinter.js");

  debug("test configuration: " + JSON.stringify(configuration));

  var bundle = new Bundle(configuration);
  bl.executePlugin(testID, bundle);

  //need a case where we are using ref for the key
  //also prefix

  describe(`Print plugin results (${testID})`, function() {
    let report = bundle.getReport(),
        formatter = bl.getFormatter("json.js");

    if (!formatter) {
      assert.fail("formatter implementation not defined");
    }
    it("should create a report object with valid schema", function() {
      let schema = require("./../fixtures/reportSchema.js"),
          Validator = require("jsonschema").Validator,
          v = new Validator(),
          jsonReport = JSON.parse(formatter(bundle.getReport())),
          validationResult = v.validate(jsonReport, schema);
      assert.equal(
        validationResult.errors.length,
        0,
        validationResult.errors
      );
    });

  });

  var stylimpl = bl.getFormatter("unix.js");
  var stylReport = stylimpl(bundle.getReport());
  debug("unix formatted report: \n" + stylReport);
});
