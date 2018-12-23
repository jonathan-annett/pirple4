# pirple2

# **pizza ordering api**

This API is [Homework Assignment #2](assignment.md) for the pirple online course. 

***TLDR*** for anyone marking this assignment: once you have [installed](#installation) the files, please [read the API documentation](/lib/handlers/README.md).  

Also, for your convenience, the assignment text has been converted to md format, with hyperlinks to demonstrated [required functionality](assignment.md).

# before you begin

To use this api, you'll need API keys from two external services - mailgun & stripe

If you haven't done so already head on over to [mailgun](https://signup.mailgun.com/new/signup) and [stripe](https://dashboard.stripe.com/register) to get your API KEYs

To test drive the API you'll need your own set of these keys.


# installation
Clone this repository into a clean folder

    git clone https://github.com/jonathan-annett/pirple2.git
    cd pirple2
    #create folder for api setttings
    mkdir -p ../.apis

# api configuration files

**../.apis/stripe.json**  
*COPY/PASTE/EDIT TO REFLECT YOUR STRIPE API SETTINGS*

    {
     "api_key" : "test_your_secret_key_1234",
     "base_url" : "https://api.stripe.com/v1",
     "currency" : "aud",
     "currency_multiplier" : 100
    }


the `currency_multiplier` is used to convert menu prices to the appropiate stripe unit when making payments. eg 100 would mean a price of 9.99 on the menu is charged at 990 currency units with stripe.
<BR>
<BR>



**../.apis/mailgun.json**  
*COPY/PASTE/EDIT TO REFLECT YOUR MAILGUN API SETTINGS*

     {
         "api_key" : "**insert key here**",
        "base_url" : "https://api.mailgun.net/v3/INSERT_SANDBOX_HERE.mailgun.org",
        "sender" : "info@INSERT_SANDBOX_HERE.mailgun.org",
        "smtp":"smtp.mailgun.org",
        "user" : "postmaster@INSERT_SANDBOX_HERE.mailgun.org"
    }

<BR>
<BR>

**../.apis/localhost.json**  
*COPY/PASTE/EDIT TO CONTROL THE AUTO-GENERATION OF LOCALHOST CERTS*

    {
     "country" : "AU",
     "state" : "Victoria",
     "locality" : "Australia",
     "email" : "admin@example.com"
    }

<BR>
<BR>

# advanced configuration options

*This step is OPTIONAL and is not required to test drive the api*

If you want to deploy this api using real SSL certs on a dynamic dns host, you'll need an externally accessible machine or vps,a [no-ip account](https://www.noip.com/), and you'll need to have installed the [letsencrypt command line tool "certbot"](https://certbot.eff.org/docs/install.html). 
If you have both of these, you can create the following additional files to take advantage of these features:

 * on server startup, the current ip address is sent to the no-ip dynamic dns updater
 * lets encrypt ssl certs are automatically generated using a bash script at configuration time
 * lets encrypt ssl certs are automatically loaded on server startup

<BR>
<BR>

**../.apis/noip.json**  
*COPY/PASTE/EDIT TO REFLECT YOUR NOIP API SETTINGS*

    {
      "username" : "<your username>",
      "password" : "<your password>",
      "hostname" : "your-pizza-shop-domain.bounceme.net",
      "domain_email" : "email-for-registrar@a-domain.com",
      "base_url"  : "http://dynupdate.no-ip.com/nic/update",
      "user_agent" : "pirple-homework/1.0 email-for-registrar@a-domain.com"
    }
    

note that the hostname listed in the above file must be associated with your no-ip account, and you need to have updated the ip once manually using the no-ip website, so it knows it's an active domain. once that's the case, you can run the letsencrypt.sh file from the terminal prompt, and you'll need to enter your password to authorize the generation of the ssl certs. 
Please fully read [***letsencrypt.sh***](letsencrypt.sh) before running it, and understand that it will start up a server on port 80 to authenticate that you "own" the domain.


[***API Documentation***](lib/handlers/README.md)
