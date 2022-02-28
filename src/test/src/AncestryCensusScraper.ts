import {assert} from 'chai';
import {Chance} from 'chance';
import {AncestryCensusScraper} from "../../AncestryCensusScraper";
import {chromium, Cookie} from 'playwright';
import {EncodeTools, IEncodeTools} from "@znetstar/encode-tools";
import {SerializationFormat} from "@znetstar/encode-tools/lib/EncodeTools";
import {URL} from 'url';
import * as fs from "fs-extra";
import path from "path";
import {
  AncestryCensusHousehold,
  AncestryCensusHouseholdMemberRelationToHeadOfHousehold
} from "../../AncestryCensusCommon";

require('dotenv').config();

describe('AncestryCensusScraper', async function () {
  let scraper: AncestryCensusScraper;
  let chance: Chance.Chance = new Chance();
  let storedCookies: Buffer;
  beforeEach(async function () {
    let cookiePath = path.join(__dirname, '..', '..', '..', 'misc', 'cookies.json');
    if (await fs.pathExists(cookiePath)) {
      storedCookies = await fs.readFile(cookiePath);
    }
    scraper = new AncestryCensusScraper({
      username: process.env.ANCESTRY_CENSUS_SCRAPER_USERNAME,
      password: process.env.ANCESTRY_CENSUS_SCRAPER_PASSWORD,
      playwrightOptions: {
        headless: !process.env.ANCESTRY_CENSUS_SCRAPER_NO_HEADLESS
      }
    });

    if (storedCookies) {
      await scraper.initBrowser();
      await scraper.loadCookies(storedCookies);
    }
  });

  describe('initBrowser', async function () {
    it('should launch a new browser if one does not exist', async function () {
      assert.notOk(scraper.browser);
      await scraper.initBrowser();
      assert.ok(scraper.browser);
    });

    it('should load existing cookies if provided at launch', async function (){
      const browser = await chromium.launch({
        headless: !process.env.ANCESTRY_CENSUS_SCRAPER_NO_HEADLESS
      });

      const context = await browser.newContext();
      let inputCookies: Cookie[] = [];

      const href = `https://www.ancestry.com/`;
      const u = new URL(href);

      for (let i = 0; i < chance.integer({ min: 1, max: 25 }); i++) {
        inputCookies.push({
          name: chance.string(),
          value: chance.string(),
          path: u.pathname,
          domain: u.hostname,
          expires: Math.round((new Date(chance.date({ min: new Date(), string: false }))).getTime()/1e3),
          httpOnly: false,
          sameSite: 'None',
          secure: u.protocol === 'https:'
        });
      }

      await context.addCookies(inputCookies);
      const cookiesEncodeTools: IEncodeTools = new EncodeTools({ serializationFormat: SerializationFormat.msgpack });
      const cookies = await context.cookies(href);
      const buf = Buffer.from(cookiesEncodeTools.serializeObject<unknown>(cookies, cookiesEncodeTools.options.serializationFormat));

      scraper = new AncestryCensusScraper({
        username: process.env.ANCESTRY_CENSUS_SCRAPER_USERNAME,
        password: process.env.ANCESTRY_CENSUS_SCRAPER_PASSWORD,
        playwrightOptions: {
          headless: !process.env.ANCESTRY_CENSUS_SCRAPER_NO_HEADLESS
        },
        cookies: buf
      });

      await scraper.initBrowser();
      const outputCookies = await scraper.context.cookies(href);
      assert.deepEqual(outputCookies, cookies);
    });
  });
  describe('saveCookies', async function () {
    it('should export cookies as a buffer', async function (){
      await scraper.initBrowser();

      let inputCookies: Cookie[] = [];

      const href = `https://www.ancestry.com/`;
      const u = new URL(href);

      for (let i = 0; i < chance.integer({ min: 1, max: 25 }); i++) {
        inputCookies.push({
          name: chance.string(),
          value: chance.string(),
          path: u.pathname,
          domain: u.hostname,
          expires: Math.round((new Date(chance.date({ min: new Date(), string: false }))).getTime()/1e3),
          httpOnly: false,
          sameSite: 'None',
          secure: u.protocol === 'https:'
        });
      }

      await scraper.context.addCookies(inputCookies);
      const cookiesEncodeTools: IEncodeTools = new EncodeTools({ serializationFormat: SerializationFormat.msgpack });
      const cookies = await scraper.context.cookies(href);
      const buf = Buffer.from(cookiesEncodeTools.serializeObject<unknown>(cookies, cookiesEncodeTools.options.serializationFormat));

      const outputCookies = await scraper.saveCookies();
      assert.deepEqual(outputCookies, buf);
    });
  });
  describe('loadCookies', async function () {
    it('load cookies from a buffer', async function (){
      const browser = await chromium.launch({
        headless: !process.env.ANCESTRY_CENSUS_SCRAPER_NO_HEADLESS
      });

      const context = await browser.newContext();
      let inputCookies: Cookie[] = [];

      const href = `https://www.ancestry.com/`;
      const u = new URL(href);

      for (let i = 0; i < chance.integer({ min: 1, max: 25 }); i++) {
        inputCookies.push({
          name: chance.string(),
          value: chance.string(),
          path: u.pathname,
          domain: u.hostname,
          expires: Math.round((new Date(chance.date({ min: new Date(), string: false }))).getTime()/1e3),
          httpOnly: false,
          sameSite: 'None',
          secure: u.protocol === 'https:'
        });
      }

      await context.addCookies(inputCookies);
      const cookiesEncodeTools: IEncodeTools = new EncodeTools({ serializationFormat: SerializationFormat.msgpack });
      const cookies = await context.cookies(href);
      const buf = Buffer.from(cookiesEncodeTools.serializeObject<unknown>(cookies, cookiesEncodeTools.options.serializationFormat));

      await scraper.initBrowser();
      await scraper.loadCookies(buf);

      const outputCookies = await scraper.context.cookies(href);
      assert.deepEqual(outputCookies, cookies);
    });
  });
  describe('getjQuery', async function () {
    it('jQuery should be undefined until loaded', async function () {
      assert.notOk(scraper.jquery);
    });

    it('should return jQuery', async function () {
      const jq = await fs.readFile(
        path.join(__dirname, '..', '..', '..', 'node_modules', 'jquery', 'dist', 'jquery.js'),
        'utf8'
      );

      assert.equal(
        await scraper.getjQuery(),
        jq
      );
    });

    it('cached jquery should be still be set', async function () {
      await scraper.getjQuery();

      const jq = await fs.readFile(
        path.join(__dirname, '..', '..', '..', 'node_modules', 'jquery', 'dist', 'jquery.js'),
        'utf8'
      );

      assert.equal(
        scraper.jquery,
        jq
      );
    });
  });

  describe('scrapeHouseholds', async function () {
    let livedIn: string;

    beforeEach(async function() {
      livedIn = chance.shuffle([
        // 'Delaware',
        //
        // 'New Hampshire',
        // 'Pennsylvania',
        // 'Georgia',
        // 'Virginia',
        // 'South Carolina',
        // 'North Carolina',
        // 'Rhode Island',
        'Maryland',
        'Massachusetts',
        'New York',
        // 'New Jersey',
        'Connecticut'
      ].map(u => `${u}, USA`))[0];
    });

    describe('1790|1800|1810', async function () {
      let household: AncestryCensusHousehold;
      let loadHousehold = async function () {
        if (!household) {
          for await (const $household of scraper.scrapeHouseholds({
            census: chance.shuffle([ 1790, 1800, 1810 ])[0] as 1790|1800|1810,
            livedIn
          })) {
            household = $household;
            break;
          }
        }
      }

      it('should have a household head', async function() {
        await loadHousehold();
        assert.ok(household.head);
        assert.equal(household.head.relationToHeadOfHouse, AncestryCensusHouseholdMemberRelationToHeadOfHousehold.head);
      });
      it('should have a household location', async function() {
        await loadHousehold();
        assert.ok(household.location);
      });
      it('total household members should equal household members in array', async function() {
        await loadHousehold();
        assert.equal(household.members.length, household.head.numberOfHouseholdMembers);
      });
    });
    describe('1820', async function () {
      let household: AncestryCensusHousehold;
      let loadHousehold = async function () {
        if (!household) {
          for await (const $household of scraper.scrapeHouseholds({
            census: chance.shuffle([ 1820 ])[0] as 1820,
            livedIn
          })) {
            household = $household;
            break;
          }
        }
      }

      it('should have a household head', async function() {
        await loadHousehold();
        assert.ok(household.head);
        assert.equal(household.head.relationToHeadOfHouse, AncestryCensusHouseholdMemberRelationToHeadOfHousehold.head);
      });
      it('should have a household location', async function() {
        await loadHousehold();
        assert.ok(household.location);
      });
      it('total household members should equal household members in array', async function() {
        await loadHousehold();
        assert.equal(household.members.length, household.head.numberOfHouseholdMembers);
      });
    });
  });

  afterEach(async function () {
    if (scraper.context) {
      storedCookies = await scraper.saveCookies();
      await scraper.closeBrowser();
    }
  });
});
