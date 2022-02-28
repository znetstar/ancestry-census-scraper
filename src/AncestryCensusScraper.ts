import {
  AncestryCensusHousehold,
  AncestryCensusHouseholdHead,
  AncestryCensusHouseholdMember,
  AncestryCensusHouseholdMemberEnslavedStatus,
  AncestryCensusHouseholdMemberRelationToHeadOfHousehold,
  AncestryCensusQuery,
  AncestryCensusQueryRangedValue,
  AncestryCensusQuerySimilarValue,
  AncestryCensusQueryValue
} from "./AncestryCensusCommon";
import {Browser, BrowserContext, chromium, LaunchOptions, Page} from 'playwright';
import {EncodeTools, IEncodeTools} from '@znetstar/encode-tools';
import {SerializationFormat} from "@znetstar/encode-tools/lib/EncodeTools";
import * as fs from 'fs-extra';
import * as path from 'path';

export type AncestryCensusScraperOptionsBase = {
  playwrightOptions?: LaunchOptions;
  minTypeSpeed?: number;
  maxTypeSpeed?: number;
  recordWait?: number;
}

export type AncestryCensusScraperOptions = (AncestryCensusScraperOptionsBase&{
  username: string;
  password: string;
  cookies?: Buffer;
})|(AncestryCensusScraperOptionsBase&{
  cookies: Buffer;
  username: void;
  password: void;
})

export class AncestryCensusScraperNoLoginError extends Error {
  constructor() {
    super(`Must provide login details`);
  }
}

export class AncestryCensusScraper {
  public browser: Browser;
  public context: BrowserContext;
  public cookiesEncodeTools: IEncodeTools = new EncodeTools({ serializationFormat: SerializationFormat.json });
  public navigationPage?: Page;
  public censusPage?: Page;
  public jquery?: string;
  constructor(protected options: AncestryCensusScraperOptions) {
    options.recordWait = options.recordWait || 1e3;
  }

  slowMo(): number {
    return 250;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        slowMo: this.slowMo(),
        timeout: 0,
        ...(this.options.playwrightOptions || {})
      });
      this.context = await this.browser.newContext();
    }

    if (this.options.cookies) {
      await this.loadCookies(this.options.cookies);
    }
  }

  async loginThenNavigate(url: string) {
    if (!this.censusPage)
      return;

    await this.censusPage.goto(url);

    if (!await this.censusPage.$('#navAccountUsername')) {
      if (!this.options.username || !this.options.password) {
        throw new AncestryCensusScraperNoLoginError();
      }
      await Promise.all([
        this.censusPage.click('#navAccount'),
        this.censusPage.waitForNavigation()
      ])
      await this.censusPage.waitForSelector('#username');
      await this.censusPage.type('#username', this.options.username);
      await this.censusPage.type('#password', this.options.password);
      await this.censusPage.click('#signInBtn');

      await this.censusPage.goto(url);
    }
  }

  async closeBrowser(): Promise<void> {
    await this.browser.close();
  }

  async getjQuery(): Promise<string> {
    if (!this.jquery) {
      this.jquery = await fs.readFile(
        path.join(__dirname, '..', 'node_modules', 'jquery', 'dist', 'jquery.js'),
        'utf8'
      );
    }
    return this.jquery;
  }

  async saveCookies(): Promise<Buffer> {
    const cookies = await this.context.cookies();
    return Buffer.from(this.cookiesEncodeTools.serializeObject<unknown>(cookies, this.cookiesEncodeTools.options.serializationFormat));
  }

  async loadCookies(cookies: Buffer): Promise<void> {
    const cookieObj = this.cookiesEncodeTools.deserializeObject<any>(Buffer.from(cookies), this.cookiesEncodeTools.options.serializationFormat);
    await this.context.addCookies(cookieObj.map((k: any) => ({
      ...k,
      sameSite: 'Lax'
    })));
  }

  averageLifeExpectancy(year: number): number {
    // From https://population.un.org/wpp/Download/Files/1_Indicators%20(Standard)/EXCEL_FILES/3_Mortality/WPP2019_MORT_F07_1_LIFE_EXPECTANCY_0_BOTH_SEXES.xlsxv
    const leMap = new Map<number, number>(
      [
        [ '1860', '39.41' ], [ '1865', '35.10' ],
        [ '1870', '39.41' ], [ '1875', '39.41' ],
        [ '1880', '39.41' ], [ '1885', '41.15' ],
        [ '1890', '44.05' ], [ '1895', '46.33' ],
        [ '1900', '48.19' ], [ '1905', '50.06' ],
        [ '1910', '51.36' ], [ '1915', '54.14' ],
        [ '1920', '53.22' ], [ '1925', '58.16' ],
        [ '1930', '58.74' ], [ '1935', '60.70' ],
        [ '1940', '62.07' ], [ '1945', '64.71' ],
        [ '1950', '67.23' ], [ '1955', '68.71' ],
        [ '1960', '69.66' ], [ '1965', '70.11' ],
        [ '1970', '70.36' ], [ '1975', '71.43' ],
        [ '1980', '73.25' ], [ '1985', '74.37' ],
        [ '1990', '74.89' ], [ '1995', '75.65' ],
        [ '2000', '76.47' ], [ '2005', '77.18' ],
        [ '2010', '78.19' ], [ '2015', '78.94' ],
        [ '2020', '78.81' ]].map((arr: [ string, string ]): [number, number] => {
          return [ Number(arr[0]), Number(arr[1]) ];
      })
    );

    if (year < 1860) return 39.41;
    else if (year > 1940) return 78.94;
    else leMap.get(year);
  }

  async* scrapeHouseholds(query: AncestryCensusQuery):  AsyncGenerator<AncestryCensusHousehold> {
    let q: AncestryCensusQuery = {
      ...query,
      // @ts-ignore
      relationToHeadOfHouse: 12
    };

    for await (const head of this.scrape(q)) {
      const household: AncestryCensusHousehold = {
        head: head as AncestryCensusHouseholdHead,
        members: [

        ],
        location: head.householdLocation
      };

      if (head.relations)
        head.relations = Array.from(head.relations);

      household.head.relationToHeadOfHouse = AncestryCensusHouseholdMemberRelationToHeadOfHousehold.head;
      household.members.push(household.head);
      if (household.head.relations) {
        for (const relationHref of household.head.relations) {
          const relation = await this.scrapeRecordFromPage(relationHref);
          household.members.push(relation);
        }
      } else {
        for (let k in head) {
          if (k.match(/under|thru|over|slave/ig) && k.toUpperCase().indexOf('total') === -1) {
            let member: AncestryCensusHouseholdMember = {...head};
            delete member.name;
            delete member.gender;
            delete member.approximateAge;
            delete member.relationToHeadOfHouse;
            delete member.alternativeName;

            if (k.match(/female/ig)) member.gender = 'Female';
            else if (k.match(/male/ig)) member.gender = 'Male';

            if (k.match(/slave/ig))
              member.enslaved = AncestryCensusHouseholdMemberEnslavedStatus.enslavedPerson;
            else if (k.match(/FreeColored/ig))
              member.enslaved = AncestryCensusHouseholdMemberEnslavedStatus.freePersonOfColor;
            else
              member.enslaved = AncestryCensusHouseholdMemberEnslavedStatus.freeWhitePerson;

            if (k.match(/under/ig)) {
              member.ageRangeMaximum = Number(k.replace(/\D/ig, ''));
              member.ageRangeMinimum = 0;
            }
            if (k.match(/over/ig)) {
              member.ageRangeMinimum = Number(k.replace(/\D/ig, ''));
              member.ageRangeMaximum = this.averageLifeExpectancy(query.census);
            }

            if (k.match(/thru/ig)) {
              member.ageRangeMinimum = Number(k.split('thru')[0].replace(/\D/ig, ''));
              member.ageRangeMaximum = Number(k.split('thru')[1].replace(/\D/ig, ''));
            }

            if (typeof(member.ageRangeMinimum) !== 'undefined' && typeof(member.ageRangeMaximum) !== 'undefined')
              member.approximateAge = Math.round((member.ageRangeMinimum + member.ageRangeMaximum) / 2);

            let num = head[k] as number;
            for (let i = 0; i < num; i++) {
              let kk = {...member};
              for (let k in kk) {
                if (k.indexOf('numberOf') !== -1) delete kk[k];
              }
              household.members.push(kk);
            }
          }
        }
      }

      yield household;
    }
  }

  async* scrape(query: AncestryCensusQuery, baseUrl?: string): AsyncGenerator<AncestryCensusHouseholdMember> {
    let hasValue = true;
    let skip = 0;

    while (hasValue) {
      hasValue = false;

      if (!baseUrl) {
        if (!this.navigationPage) {
          const navigationPage = this.navigationPage = await this.context.newPage();
          await navigationPage.addScriptTag({
            type: 'text/javascript',
            content: await this.getjQuery()
          });
          await navigationPage.goto(`https://www.archives.gov/research/census/online-resources`);
        }

        baseUrl = await this.navigationPage.evaluate((year: number) => {
          // @ts-ignore
          window.jQuery(`a:contains("${year} Census")`).click();
          // @ts-ignore
          const url = window.jQuery(`.panel:contains("${year} Census") li:contains("by subscription") a`).attr('href');
          return url;
        }, query.census);
      }

      const uBreakdown = new URL(this.censusPage ? this.censusPage.url() : baseUrl);
      uBreakdown.searchParams.set('fh', skip.toString());
      const url = uBreakdown.href;

      for await (const result of this.scrapePage(query, url)) {
        hasValue = true;
        yield result;
      }
      if (hasValue)
        skip += 50;
    }

    if (this.censusPage) {
      await this.censusPage.close();
      this.censusPage = void(0);
    }
  }

  async scrapeRecordFromPage(href: string): Promise<AncestryCensusHouseholdMember> {

    const recordPage = await this.context.newPage();
    await recordPage.goto(
      href
    );

    await recordPage.addScriptTag({
      type: 'text/javascript',
      content: await this.getjQuery()
    });


    await recordPage.evaluate((ele) => {
      // @ts-ignore
      window.jQuery('iframe').remove();
    });
    let record = await (await recordPage.$('body')).evaluate(async () => {
      // @ts-ignore
      const $ = window.jQuery;
      const card = $('table#recordServiceData');
      const record = {};
      for (const row of $('tr', card)) {
        try {
          if ($(row).is('.tableContainerRow').length || $(row).parents('.tableContainerRow').length)
            continue;
          let keyRaw = $('th', row)
            .text()
            .replace(/\(|,|\)|:|-|'/g, '');

          if (!keyRaw.length)
            keyRaw = 'householdLocation';

          keyRaw = keyRaw.split(' ');

          let keyBits = [];
          for (let keyBit of keyRaw) {
            keyBits.push(
              keyBit[0].toUpperCase() +
              keyBit.substr(1)
            );
          }

          let key = keyBits.join('');
          key = key[0].toLowerCase() + key.substr(1);

          const rawValue = $('td', row).text().trim();
          let value;

          if (rawValue === 'Yes') value = true;
          else if (rawValue === 'No') value = false;
          else if (!Number.isNaN(Number(rawValue))) value = Number(rawValue);
          else value = rawValue;

          if (key === 'householdMembersAgeRelationship')
            continue;

          // @ts-ignore
          record[key] = value;
        } catch (err) {
          console.warn(`could not parse data: ` + err.stack);
        }
      }

      if ($('[data-is-household] a[title="View Record"]').length) {
        // @ts-ignore
        record.relations = Array.from($('[data-is-household] a[title="View Record"]').map(function () {
          return $(this).attr('href') ? $(this).attr('href').toString() : null;
        })).filter(Boolean);
        // @ts-ignore
        record.numberOfHouseholdMembers = record.relations.length;
      }
      for (let k in record) {
        // @ts-ignore
        let v = record[k];
        if (typeof(v) === 'string' && v.indexOf("\n\t\t") !== -1 && v.match(/\n\t\t\t\t\t\t\t\t\t\t\[(.*)\]/)) {

          // @ts-ignore
          record[k] = v.split("\n\t\t\t\t\t\t\t\t\t\t").shift().trim();

          // @ts-ignore
          const alt = v.match(/\n\t\t\t\t\t\t\t\t\t\t\[(.*)\]/g).map((m) => {
            return m.replace(/\[|\]/g, '').trim();
          });

          // @ts-ignore
          record['alternative'+k[0].toUpperCase()+k.substr(1)] = alt;
        }
      }

      // @ts-ignore
      if (record.age) record.approximateAge = record.age;

      $(`<pre id="record" style="display: none;">${JSON.stringify(record)}</pre>`).appendTo(document.body);

      return record;
      // @ts-ignore
    });

    if (!record) {
      // @ts-ignore
      record = JSON.parse(await (await recordPage.$('#record')).innerHTML());
    }

    await recordPage.close();

    for (let k in record) {
      if (k.indexOf('homeIn') !== -1) {
        // @ts-ignore
        record.householdLocation = record[k];
      }
    }
    return record as AncestryCensusHouseholdMember;
  }

  async* scrapePage(query: AncestryCensusQuery, url: string): AsyncGenerator<AncestryCensusHouseholdMember> {
    await this.initBrowser();

    let censusPage = this.censusPage;
    if (!censusPage) {
      censusPage = this.censusPage = await this.context.newPage();
      await this.loginThenNavigate(url);

      const typeClick = async (selector: string, value: AncestryCensusQuerySimilarValue | AncestryCensusQueryValue | AncestryCensusQueryRangedValue, select?: boolean) => {

        await censusPage.waitForSelector(selector, { strict: false, state: 'attached' });


        if (selector.indexOf('select') === -1)
          await censusPage.type(selector, (typeof (value) === 'string' || typeof (value) === 'number') ? value.toString() : value.value.toString());
        else
          await censusPage.selectOption(selector, (typeof (value) === 'string' || typeof (value) === 'number') ? value.toString() : value.value.toString());

        if (typeof (value) === 'object' && value.exact) {
          if (await censusPage.$(`${selector} [data-autoname="ExactPhonetic"]`)) {
            await censusPage.check(`${selector} [data-autoname="ExactAnd"]`);
            // @ts-ignore
            if (value.exact.soundsLike) {
              await censusPage.check(`${selector} [data-autoname="ExactPhonetic"]`);
              // @ts-ignore
            } else if (value.exact.similar) {
              await censusPage.check(`${selector} [data-autoname="ExactMeaningOrSpell"]`);
              // @ts-ignore
            } else if (value.exact.initials) {
              await censusPage.check(`${selector} [data-autoname="ExactInitials"]`);
            }
          } else if (await censusPage.$(`${selector} [data-ng-model="isYearExact"]`)) {
            await censusPage.check(`${selector} li[data-ng-repeat="exactness in exactnesses"]:nth-child(${value.exact}) input[type="radio"]`);
          } else {
            await censusPage.click(`${selector} [data-ng-hide="relativeExactnesses.length > 1"]`);
          }
        }
      }
      if (query.matchAllTermsExactly) {
        await censusPage.waitForSelector('[data-ng-checked="model.isExactAllEnabled"]');
        await censusPage.check('[data-ng-checked="model.isExactAllEnabled"]');
      }

      const values: [string, AncestryCensusQuerySimilarValue | AncestryCensusQueryValue | AncestryCensusQueryRangedValue][] = [
        ['[name="gsfn"]', query.firstAndMiddleNames],
        ['[name="gsln"]', query.lastName],
        ['[name="msrpn__ftp"]', query.livedIn],
        ['[name="msypn__ftp"]', query.anyEvent],
        ['[name="gskw"]', query.keyword]
      ]

      if (query.census === 1790 || query.census === 1800 || query.census === 1810) {
        values.push(
          ['[name="_F000512E"]', query.freeWhiteMales16AndOver],
          ['[name="_F0005130"]', query.freeWhiteMales16AndUnder],
          ['[name="_F0005132"]', query.freeWhitePersonsFemales],
          ['[name="_F0005102"]', query.numberOfAllOtherFreePersons],
          ['[name="_F0005104"]', query.numberOfSlaves],
          ['[name="_F0005134"]', query.numberOfHouseholdMembers]
        )
      } else if (query.census === 1820) {
        values.push(
          ['[name="_F0005351"]', query.freeWhitePersonsUnder16],
          ['[name="_F0005352"]', query.freeWhitePersonsOver25],
          ['[name="_F0005353"]', query.totalFreeWhitePersons],
          ['[name="_F0005321"]', query.totalFreeColoredPersons],
          ['[name="_F0005355"]', query.totalAllPersons]
        )
      } else if (query.census === 1830) {
        values.push(
          ['[name="_F0006BD3"]', query.freeWhitePersonsUnder20],
          ['[name="_F0006BD6"]', query.totalSlaves],
          ['[name="_F0006BD7"]', query.totalFreeColoredPersons],
          ['select#sfs__F0006BD4_5467749', query.freeWhitePersons20Thru49],
          ['select#sfs__F0006BC0_5467747', query.totalAllPersons],
          ['select#sfs__F0006BD5_5467750', query.totalFreeWhitePersons]
        )
      } else if (query.census === 1840) {
        values.push(
          ['[name="msydy"]', query.anyEventYear]
        )
      } else if (query.census === 1850) {
        values.push(
          ['[name="msydy"]', query.anyEventYear],
          ['[name="msbdy"]', query.birthYear ],
          ['[name="msbpn__ftp"]', query.birthLocation ],
          ['select#sfs_GenderModule', query.gender ]
        )
      } else if (query.census === 1860) {
        values.push(
          ['[name="msydy"]', query.anyEventYear],
          ['[name="_83004047"]', query.occupation],
          ['[name="_F19A385C"]', query.dwellingNumber ],
          ['[name="_F1B3D4FA__int"]', query.familyNumber ],
          ['[name="_F5EC86FF"]', query.realEstateValue ],
          ['[name="_F5F6A807"]', query.personalEstateValue ],
          ['[name="_F6E8568B"]', query.attendedSchool ],
          ['select#sfs_GenderModule', query.gender ]
        )
      } else if (query.census === 1870) {
        values.push(
          ['[name="msydy"]', query.anyEventYear],
          ['[name="_83004007"]', query.occupation],
          ['[name="_F19A385C"]', query.dwellingNumber ],
          ['[name="_F22261A1"]', query.maleCitizenOver21 ],
          ['[name="_F4459E04"]', query.cannotRead ],
          ['[name="_F5CC9D84"]', query.cannotWrite ],
          ['[name="_F5F6A807"]', query.personalEstateValue ],
          ['[name="_F6E8568B"]', query.attendedSchool ],
          ['[name="_83004002"]', query.raceNationality ],
          ['select#sfs_GenderModule', query.gender ]
        );

        if (query.familyMembers) {
          let spouseNum = 0;
          let childNum = 0;
          for (const mem of query.familyMembers) {
            if (mem.type === 'Father') {
              values.push(['[name="msfng"]', mem.firstAndMiddleNames]);
              values.push(['[name="msfns"]', mem.lastName]);
            }
            else if (mem.type === 'Mother') {
              values.push(['[name="msmng"]', mem.firstAndMiddleNames]);
              values.push(['[name="msmns"]', mem.lastName]);
            }
            else if (mem.type === 'Spouse') {
              values.push([`[name="mssng${ (spouseNum++) ? (spouseNum) : '' }"]`, mem.firstAndMiddleNames]);
              values.push([`[name="mssns${ (spouseNum) ? (spouseNum) : '' }"]` , mem.lastName]);
            }
            else if (mem.type === 'Child') {
              values.push([`[name="mscng${ (childNum++) ? (childNum) : '' }"]`, mem.firstAndMiddleNames]);
              values.push([`[name="mscns${ (childNum) ? (childNum) : '' }"]` , mem.lastName]);
            }
          }
        }
      } else if (query.census === 1880) {
        values.push(
          ['[name="msydy"]', query.anyEventYear],
          ['[name="_83004007"]', query.occupation],
          ['[name="_F19A385C"]', query.dwellingNumber ],
          ['[name="_F22261A1"]', query.maleCitizenOver21 ],
          ['[name="_F4459E04"]', query.cannotRead ],
          ['[name="_F5CC9D84"]', query.cannotWrite ],
          ['[name="_F5F6A807"]', query.personalEstateValue ],
          ['[name="_F6E8568B"]', query.attendedSchool ],
          ['[name="_83004002"]', query.raceNationality ],
          ['select#sfs_GenderModule', query.gender ]
        )

        if (query.familyMembers) {
          let spouseNum = 0;
          let childNum = 0;
          for (const mem of query.familyMembers) {
            if (mem.type === 'Father') {
              values.push(['[name="msfng"]', mem.firstAndMiddleNames]);
              values.push(['[name="msfns"]', mem.lastName]);
            }
            else if (mem.type === 'Mother') {
              values.push(['[name="msmng"]', mem.firstAndMiddleNames]);
              values.push(['[name="msmns"]', mem.lastName]);
            }
            else if (mem.type === 'Spouse') {
              values.push([`[name="mssng${ (spouseNum++) ? (spouseNum) : '' }"]`, mem.firstAndMiddleNames]);
              values.push([`[name="mssns${ (spouseNum) ? (spouseNum) : '' }"]` , mem.lastName]);
            }
            else if (mem.type === 'Child') {
              values.push([`[name="mscng${ (childNum++) ? (childNum) : '' }"]`, mem.firstAndMiddleNames]);
              values.push([`[name="mscns${ (childNum) ? (childNum) : '' }"]` , mem.lastName]);
            }
          }
        }
      } else if (query.census === 1890) {
        values.push(
          ['[name="msydy"]', query.anyEventYear],
          ['[name="_83004002"]', query.raceNationality ],
          ['select#sfs_GenderModule', query.gender ],
          ['select#sfs__SelfRelationToHead_12792351', query.relationToHeadOfHouse ],
          ['[name="_8200C010__ftp"]', query.fathersBirthplace ],
          ['[name="_82008010__ftp"]', query.mothersBirthplace ],
        )
      } else if (query.census === 1940) {
        values.push(
          ['[name="msydy"]', query.anyEventYear],
          ['[name="_83004002"]', query.raceNationality ],
          ['select#sfs_GenderModule', query.gender ],
          ['select[id*="sfs__SelfRelationToHead"]', query.relationToHeadOfHouse ],
          ['select[id*="sfs_SelfMaritalStatus"]', query.maritalStatus ],
          ['[name="_83004047"]', query.occupation ],
          ['[name="_F07AB145"]', query.highestGradeCompleted ],
          ['[name="_F0B3C3B8"]', query.houseNumber ],
          ['[name="_F11B3B46"]', query.sheetNumber ],
          ['[name="_F17454BA"]', query.weeksWorkedIn1939 ],
          ['[name="_F174871C"]', query.residentOnFarmIn1935 ],
          ['[name="_F19A385C"]', query.numberOfHouseholdInOrderOfVisitation ],
          ['[name="_F1E3A106"]', query.valueOfHomeOrMonthlyRentalIfRented ],
          ['[name="_F2296D80"]', query.incomeOtherSources ],
          ['[name="_F300DE3F"]', query.respondent ],
          ['[name="_F3FD0606"]', query.classOfWorker ],
          ['[name="_F43CEB00"]', query.houseOwnedOrRented ],
          ['[name="_F54892CF"]', query.income ],
          ['[name="_F63E84B9"]', query.hoursWorkedWeekPriorToCensus ],
          ['[name="_F6E8568B"]', query.attendedSchoolOrCollege ],
          ['[name="_83004002"]', query.raceNationality ],
          ['select[id*="sfs_GenderModule"]', query.gender ]
        );

        if (query.familyMembers) {
          let spouseNum = 0;
          let childNum = 0;
          for (const mem of query.familyMembers) {
            if (mem.type === 'Father') {
              values.push(['[name="msfng"]', mem.firstAndMiddleNames]);
              values.push(['[name="msfns"]', mem.lastName]);
            }
            else if (mem.type === 'Mother') {
              values.push(['[name="msmng"]', mem.firstAndMiddleNames]);
              values.push(['[name="msmns"]', mem.lastName]);
            }
            else if (mem.type === 'Spouse') {
              values.push([`[name="mssng${ (spouseNum++) ? (spouseNum) : '' }"]`, mem.firstAndMiddleNames]);
              values.push([`[name="mssns${ (spouseNum) ? (spouseNum) : '' }"]` , mem.lastName]);
            }
            else if (mem.type === 'Child') {
              values.push([`[name="mscng${ (childNum++) ? (childNum) : '' }"]`, mem.firstAndMiddleNames]);
              values.push([`[name="mscns${ (childNum) ? (childNum) : '' }"]` , mem.lastName]);
            }
          }
        }
      }

      for (const [selector, value] of values) {
        if (value)
          await typeClick(selector, value);
      }

      await Promise.all([
        censusPage.click('[type="submit"]'),
        censusPage.waitForNavigation()
      ]);
    } else {
      await this.loginThenNavigate(url);
    }

    await censusPage.waitForSelector('#results-main');

    const rows = await censusPage.$$('#results-main table tr td.firstcol span a');

    for (const row of rows) {
      const href = await row.getAttribute('href');
      const record = await this.scrapeRecordFromPage(href);
      yield record as AncestryCensusHouseholdMember;
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, this.options.recordWait);
      });
    }
  }
}
