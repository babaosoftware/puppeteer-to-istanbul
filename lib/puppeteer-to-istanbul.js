const fs = require('fs')
const OutputFiles = require('./output-files')
const mkdirp = require('mkdirp')
const PuppeteerToV8 = require('./puppeteer-to-v8')
const v8toIstanbul = require('v8-to-istanbul')

class PuppeteerToIstanbul {
  constructor (coverageInfo) {
    this.coverageInfo = coverageInfo
    this.puppeteerToConverter = OutputFiles(coverageInfo).getTransformedCoverage()
    this.puppeteerToV8Info = PuppeteerToV8(this.puppeteerToConverter).convertCoverage()
  }

  setCoverageInfo (coverageInfo) {
    this.coverageInfo = coverageInfo
  }

  mergeCoverage(prev, current){
    if (!prev)
      return current;

    for (let [key, value] of Object.entries(prev['s'])) {
      prev['s'][key] += current['s'][key]; 
    }      
    return prev;
  }

  writeIstanbulFormat () {
    const jsonPath = './.nyc_output/out.json';
    var fullJson = {}

    var prevJson = {};
    if (fs.existsSync(jsonPath))
      prevJson = JSON.parse(fs.readFileSync(jsonPath));

    this.puppeteerToV8Info.forEach(jsFile => {
      const script = v8toIstanbul(jsFile.url)
      script.applyCoverage(jsFile.functions)

      let istanbulCoverage = script.toIstanbul()
      let keys = Object.keys(istanbulCoverage)

      fullJson[keys[0]] = this.mergeCoverage(prevJson[keys[0]], istanbulCoverage[keys[0]]);
    })

    mkdirp.sync('./.nyc_output')
    fs.writeFileSync(jsonPath, JSON.stringify(fullJson), 'utf8')
  }
}

module.exports = function (coverageInfo) {
  return new PuppeteerToIstanbul(coverageInfo)
}
