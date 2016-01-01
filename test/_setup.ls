require! 'chai'
chai.use require('chai-as-promised')

global.expect = chai.expect
global.test = it    # because livescript sees "it" as reserved variable
