# pirple2

#**pizza ordering api**

[assignment](assignment.md)

***this project is under development***
***and is not complete***


#installation

    mkdir -p ~/jonathan.annett.homework
    cd ~/jonathan.annett.homework
    # if reinstalling
    rm -rf ./pirple2
    git clone https://github.com/jonathan-annett/pirple2.git
    cd pirple2
    

#configuration

    mkdir -p ~/jonathan.annett.homework/.apis
    $(which nano||which vi) ~/jonathan.annett.homework/.apis/mailgun.json
    
*PASTE AND EDIT TO REFLECT YOUR API SETTINGS*

    {
        "api_key" : "**insert key here**",
        "base_url" : "https://api.mailgun.net/v3/INSERT_SANDBOX_HERE.mailgun.org",
        "sender" : "info@INSERT_SANDBOX_HERE.mailgun.org"
    }


