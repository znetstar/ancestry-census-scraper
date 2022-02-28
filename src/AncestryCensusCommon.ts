export type AncestryCensusYear = 1790|1800|1810|1820|1830|1840|1850|1860|1870|1880|1890|1900|1910|1920|1930|1940;
export type AncestryCensusGender = 'Male'|'Female';
export enum AncestryCensusQueryGender {
  Male = 'm',
  Female = 'f'
}
export type AncestryCensusFamilyMemberType = 'Father'|'Mother'|'Spouse'|'Child';

export type AncestryCensusPerson = {
  firstAndMiddleNames?: AncestryCensusQuerySimilarValue;
  lastName?: AncestryCensusQuerySimilarValue;
}

export type AncestryCensusQueryValue = {
  value: string;
  exact?: boolean;
}|string;

export type AncestryCensusQuerySimilarValue = AncestryCensusQueryValue|{
  value: string;
  exact?: boolean;
  soundsLike?: boolean;
  similar?: boolean;
  initials?: boolean;
}

export enum AncestryCensusQueryExactTo {
  thisYear = 1,
  oneYear = 2,
  twoYears = 3,
  fiveYears = 4,
  tenYears = 5
}

export enum AncestryCensusQueryMonth {
  Jan = 0,
  Feb = 1,
  Mar = 2,
  Apr = 3,
  May = 4,
  Jun = 5,
  Jul = 6,
  Aug = 7,
  Sep = 8,
  Oct = 9,
  Nov = 10,
  Dec = 11
}

export type AncestryCensusQueryRangedValue = {
  value: number;
  exact?: AncestryCensusQueryExactTo
}|number;

export type AncestryCensusQueryBase = {
  census: AncestryCensusYear;
  matchAllTermsExactly?: boolean;
  keyword?: AncestryCensusQueryValue;
  livedIn?: AncestryCensusQueryLocation;
}&AncestryCensusPerson;

export type AncestryCensusQueryLocation = AncestryCensusQueryValue;

export type AncestryCensusMartialStatus = 'Divorced'|'Married'|'NA'|'Single'|'Widowed'|'Widower';
export type AncestryCensusFamilyRelation1890Value = 'Boarder'|'Daughter'|'Grandson'|'Head'|'Lodger'|'Mother'|'Servant'|'Son'|'Wife';
export type AncestryCensusFamilyRelation1900Value = 'Boarder'|'Brother'|'Brother in Law'|'Cousin'|'Daughter'|'Daughter in Law'|'Father'|'Father in Law'|'Grand Son'|'Granddaughter'|'Head'|'Inmate'|'Lodger'|'Mother'|'Mother in Law'|'Nephew'|'Niece'|'Partner'|'Patient'|'Roomer'|'Servant'|'Sister'|'Sister in Law'|'Son'|'Son in Law'|'Step Daughter'|'Step Son'|'Wife';
export type AncestryCensusFamilyRelation1940Value = 'Boarder'|'Brother'|'Brother-in-law'|'Cousin'|'Daughter'|'Daughter-in-law'|'Esposa'|'Father'|'Father-in-law'|'Granddaughter'|'Grandson'|'Guest'|'Head'|'Hija'|'Hijo'|'Hired Hand'|'Housekeeper'|'Inmate'|'Jefe'|'Lodger'|'Maid'|'Mother'|'Mother-in-law'|'Nephew'|'Niece'|'Partner'|'Patient'|'Roomer'|'Servant'|'Sister'|'Sister-in-law'|'Son'|'Son-in-law'|'Stepdaughter'|'Stepson'|'Wife'

export type AncestryCensusFamilyRelation1890 = {
  value: AncestryCensusFamilyRelation1890Value,
  exact?: boolean;
}|AncestryCensusFamilyRelation1890Value

export type AncestryCensusFamilyRelation1900 = {
  value: AncestryCensusFamilyRelation1900Value,
  exact?: boolean;
}|AncestryCensusFamilyRelation1900Value

export type AncestryCensusFamilyRelation1940 = {
  value: AncestryCensusFamilyRelation1940Value,
  exact?: boolean;
}|AncestryCensusFamilyRelation1940Value

export type AncestryCensusQuery = (AncestryCensusQueryBase&{
  census: 1790|1800|1810;
  anyEvent?: AncestryCensusQueryLocation;
  keyword?: AncestryCensusQueryValue;
  freeWhiteMales16AndOver?: AncestryCensusQueryValue;
  freeWhiteMales16AndUnder?: AncestryCensusQueryValue;
  freeWhitePersonsFemales?: AncestryCensusQueryValue;
  numberOfAllOtherFreePersons?: AncestryCensusQueryValue;
  numberOfSlaves?: AncestryCensusQueryValue;
  numberOfHouseholdMembers?: AncestryCensusQueryValue;
})|(AncestryCensusQueryBase&{
  census: 1820;
  anyEvent?: AncestryCensusQueryLocation;
  freeWhitePersonsUnder16?: AncestryCensusQueryValue;
  freeWhitePersonsOver25?: AncestryCensusQueryValue;
  totalFreeWhitePersons?: AncestryCensusQueryValue;
  totalSlaves?: AncestryCensusQueryValue;
  totalFreeColoredPersons?: AncestryCensusQueryValue;
  totalAllPersons?: AncestryCensusQueryValue;
})|(AncestryCensusQueryBase&{
  census: 1830;
  anyEvent?: AncestryCensusQueryLocation;
  freeWhitePersonsUnder20?: AncestryCensusQueryValue;
  freeWhitePersons20Thru49?: 0|1|2|3|4|5;
  totalFreeWhitePersons?: 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14;
  totalSlaves?: AncestryCensusQueryValue;
  totalFreeColoredPersons?: AncestryCensusQueryValue;
  totalAllPersons?: 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14;
})|(AncestryCensusQueryBase&{
  census: 1840;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventYear?: AncestryCensusQueryRangedValue;
})|(AncestryCensusQueryBase&{
  census: 1850;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthYear?: AncestryCensusQueryRangedValue;
  gender?: AncestryCensusQueryGender;
})|(AncestryCensusQueryBase&{
  census: 1860;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthYear?: AncestryCensusQueryRangedValue;
  occupation?: AncestryCensusQueryValue;
  dwellingNumber?: AncestryCensusQueryValue;
  familyNumber?: AncestryCensusQueryValue;
  realEstateValue?: AncestryCensusQueryValue;
  personalEstateValue?: AncestryCensusQueryValue;
  attendedSchool?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
})|(AncestryCensusQueryBase&{
  census: 1870;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType })[]
  occupation?: AncestryCensusQueryValue;
  dwellingNumber?: AncestryCensusQueryValue;
  maleCitizenOver21?: AncestryCensusQueryValue;
  cannotRead?: AncestryCensusQueryValue;
  cannotWrite?: AncestryCensusQueryValue;
  personalEstateValue?: AncestryCensusQueryValue;
  attendedSchool?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
})|(AncestryCensusQueryBase&{
  census: 1880;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType|'Sibling' })[];
  relationToHeadOfHouse?: AncestryCensusQueryValue;
  maritalStatus?: AncestryCensusMartialStatus;
  occupation?: AncestryCensusQueryValue;
  houseNumber?: AncestryCensusQueryValue
  dwellingNumber?: AncestryCensusQueryValue;
  maleCitizenOver21?: AncestryCensusQueryValue;
  cannotRead?: AncestryCensusQueryValue;
  cannotWrite?: AncestryCensusQueryValue;
  personalEstateValue?: AncestryCensusQueryValue;
  attendedSchool?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
  fathersBirthplace?: AncestryCensusQueryLocation;
  mothersBirthplace?: AncestryCensusQueryLocation;
})|(AncestryCensusQueryBase&{
  census: 1890;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthYear?: AncestryCensusQueryRangedValue;
  relationToHeadOfHouse?: AncestryCensusFamilyRelation1890;
  maritalStatus?: AncestryCensusMartialStatus;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
  fathersBirthplace?: AncestryCensusQueryLocation;
  mothersBirthplace?: AncestryCensusQueryLocation;
})|(AncestryCensusQueryBase&{
  census: 1900;
  marriageYear?: AncestryCensusQueryRangedValue;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventMonth?: AncestryCensusQueryMonth;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthMonth?: AncestryCensusQueryMonth;
  birthYear?: AncestryCensusQueryRangedValue;
  arrivalYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType|'Sibling' })[];
  relationToHeadOfHouse?: AncestryCensusFamilyRelation1900;
  maritalStatus?: AncestryCensusMartialStatus;
  occupation?: AncestryCensusQueryValue;
  houseNumber?: AncestryCensusQueryValue
  dwellingNumber?: AncestryCensusQueryValue;
  maleCitizenOver21?: AncestryCensusQueryValue;
  cannotRead?: AncestryCensusQueryValue;
  cannotWrite?: AncestryCensusQueryValue;
  personalEstateValue?: AncestryCensusQueryValue;
  attendedSchool?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
  fathersBirthplace?: AncestryCensusQueryLocation;
  mothersBirthplace?: AncestryCensusQueryLocation;
})|(AncestryCensusQueryBase&{
  census: 1910;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventMonth?: AncestryCensusQueryMonth;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthMonth?: AncestryCensusQueryMonth;
  birthYear?: AncestryCensusQueryRangedValue;
  arrivalYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType|'Sibling' })[];
  relationToHeadOfHouse?: AncestryCensusQueryValue;
  maritalStatus?: AncestryCensusQueryValue;
  occupation?: AncestryCensusQueryValue;
  numberOfChildrenLiving?: AncestryCensusQueryValue;
  farmOrHouse?: AncestryCensusQueryValue;
  nativeTongue?: AncestryCensusQueryValue;
  outOfWork?: AncestryCensusQueryValue;
  numberOfWeeksOutOfWork?: AncestryCensusQueryValue;
  numberOfChildrenBorn?: AncestryCensusQueryValue;
  homeOwnedRenter?: AncestryCensusQueryValue;
  employerEmployeeOther?: AncestryCensusQueryValue;
  ableToRead?: AncestryCensusQueryValue;
  industry?: AncestryCensusQueryValue;
  ableToWrite?: AncestryCensusQueryValue;
  attendedSchool?: AncestryCensusQueryValue
  yearsMarried?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
  fathersBirthplace?: AncestryCensusQueryLocation;
  mothersBirthplace?: AncestryCensusQueryLocation;
})|(AncestryCensusQueryBase&{
  census: 1920;

  anyEvent?: AncestryCensusQueryLocation;
  anyEventMonth?: AncestryCensusQueryMonth;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthMonth?: AncestryCensusQueryMonth;
  birthYear?: AncestryCensusQueryRangedValue;
  arrivalYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType|'Sibling' })[];
  relationToHeadOfHouse?: AncestryCensusQueryValue;
  maritalStatus?: AncestryCensusQueryValue;
  occupation?: AncestryCensusQueryValue;
  houseNumber?: AncestryCensusQueryValue;
  homeFreeOrMortgage?: AncestryCensusQueryValue;
  homeOwnedRented?: AncestryCensusQueryValue;
  nativeTongue?: AncestryCensusQueryValue;
  ableToRead?: AncestryCensusQueryValue;
  ableToWrite?: AncestryCensusQueryValue;
  homeOwnedRenter?: AncestryCensusQueryValue;
  naturalizationStatus?: AncestryCensusQueryValue;
  industry?: AncestryCensusQueryValue;
  attendedSchool?: AncestryCensusQueryValue;
  ableToSpeakEnglish?: AncestryCensusQueryValue;
  employmentField?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
  fathersBirthplace?: AncestryCensusQueryLocation;
  mothersBirthplace?: AncestryCensusQueryLocation;
  residenceDate?: AncestryCensusQueryRangedValue;
})|(AncestryCensusQueryBase&{
  census: 1930;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventMonth?: AncestryCensusQueryMonth;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthMonth?: AncestryCensusQueryMonth;
  birthYear?: AncestryCensusQueryRangedValue;
  arrivalYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType|'Sibling' })[];
  relationToHeadOfHouse?: AncestryCensusQueryValue;
  maritalStatus?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
  fathersBirthplace?: AncestryCensusQueryLocation;
  mothersBirthplace?: AncestryCensusQueryLocation;
})|(AncestryCensusQueryBase&{
  census: 1940;
  anyEvent?: AncestryCensusQueryLocation;
  anyEventMonth?: AncestryCensusQueryMonth;
  anyEventYear?: AncestryCensusQueryRangedValue;
  birthLocation?: AncestryCensusQueryLocation;
  birthMonth?: AncestryCensusQueryMonth;
  birthYear?: AncestryCensusQueryRangedValue;
  arrivalYear?: AncestryCensusQueryRangedValue;
  familyMembers?: (AncestryCensusPerson&{ type: AncestryCensusFamilyMemberType|'Sibling' })[];
  relationToHeadOfHouse?: AncestryCensusFamilyRelation1940;
  maritalStatus?: AncestryCensusQueryValue;
  occupation?: AncestryCensusQueryValue;
  highestGradeCompleted?: AncestryCensusQueryValue;
  houseNumber?: AncestryCensusQueryValue;
  sheetNumber?: AncestryCensusQueryValue;
  weeksWorkedIn1939?: AncestryCensusQueryValue;
  residentOnFarmIn1935?: AncestryCensusQueryValue;
  numberOfHouseholdInOrderOfVisitation?: AncestryCensusQueryValue;
  valueOfHomeOrMonthlyRentalIfRented?: AncestryCensusQueryValue;
  farm?: AncestryCensusQueryValue;
  incomeOtherSources?: AncestryCensusQueryValue;
  respondent?: AncestryCensusQueryValue;
  classOfWorker?: AncestryCensusQueryValue;
  houseOwnedOrRented?: AncestryCensusQueryValue;
  income?: AncestryCensusQueryValue;
  hoursWorkedWeekPriorToCensus?: AncestryCensusQueryValue;
  attendedSchoolOrCollege?: AncestryCensusQueryValue;
  gender?: AncestryCensusQueryGender;
  raceNationality?: AncestryCensusQueryValue;
});

export type AncestryCensusHouseholdBase = {
  census: AncestryCensusYear;
  name: string;
  homeLocation: string;
}

export enum AncestryCensusHouseholdMemberGender {
  male = 'Male',
  female = 'Female'
}

export enum AncestryCensusHouseholdMemberEnslavedStatus{
  freeWhitePerson = 0,
  freePersonOfColor = 1,
  enslavedPerson = 2
}

export enum AncestryCensusHouseholdMemberRelationToHeadOfHousehold {
  boarder = 'Boarder',
  brother = 'Brother',
  brotherInLaw = 'Brother-in-law',
  cousin = 'Cousin',
  daughter = 'Daughter',
  daughterInLaw = 'Daughter-in-law',
  esposa = 'Esposa',
  father = 'Father',
  fatherInLaw = 'Father-in-law',
  granddaughter = 'Granddaughter',
  grandson = 'Grandson',
  guest = 'Guest',
  head = 'Head',
  inmate = 'Inmate',
  hiredHand = 'Hired Hand',
  housekeeper = 'Housekeeper',
  lodger = 'Lodger',
  maid = 'Maid',
  mother = 'Mother',
  motherInLaw = 'Mother-in-law',
  nephew = 'Nephew',
  niece = 'Niece',
  partner = 'Partner',
  roomer = 'Roomer',
  servant = 'Servant',
  sister = 'Sister',
  sisterInLaw = 'Sister-in-law',
  son = 'Son',
  sonInLaw = 'Son-in-law',
  stepdaughter = 'Stepdaughter',
  stepson = 'Stepson',
  wife = 'Wife'
}

export type AncestryCensusHouseholdMember = {
  census: AncestryCensusYear;
  name?: string;
  householdLocation: string
  relationToHeadOfHouse: AncestryCensusHouseholdMemberRelationToHeadOfHousehold;
  relations?: string[];
  enslaved?: AncestryCensusHouseholdMemberEnslavedStatus;
  gender?: AncestryCensusGender;
  ageRangeMinimum?: number;
  ageRangeMaximum?: number;
  approximateAge?: number;
  [key: string]: string|number|boolean|string[]|undefined;
}

export type AncestryCensusHouseholdHead = (AncestryCensusHouseholdMember&{
  relationToHeadOfHouse: AncestryCensusHouseholdMemberRelationToHeadOfHousehold.head;
  name: string
  relations: string[];
});

export type AncestryCensusHousehold = {
  location: string;
  members: AncestryCensusHouseholdMember[];
  head: AncestryCensusHouseholdHead;
}
