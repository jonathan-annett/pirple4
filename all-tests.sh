#
#  File: all-tests.sh
#  Project: Asignment 2 https://github.com/jonathan-annett/pirple2
#  Synopsis: test script to demonstrate required functionality.
#
#  Arguments:
#  $1 = optional email address for test user (if you supply this, 
#       mailgun must have permission to send mail to it)
#

#
# Copyright 2018 Jonathan Annett
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
# and associated documentation files (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
# and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
# subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all copies or substantial portions
# of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#


source new-user-test.sh $1 && \
source existing-user-test.sh $1 && \
source existing-user-search.sh $1 && \
source existing-user-edit.sh $1 && \
source existing-user-edit2.sh $1 && \
source existing-user-edit3.sh $1  
