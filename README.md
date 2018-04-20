NOTE: This is work in progress. Planning for an alpha by mid May.

# ScuttleKit

ScuttleKit lets developers build distributed web applications on the Secure Scuttlebutt (SSB) network. End users (who will be running the ssb-scuttlekit plugin locally) will be able to run untrusted apps on their web browsers in much the same way web applications are used today. On first run, ScuttleKit will prompt end-users to approve permissions to access the local SSB network. 

Apps will use the ScuttleKit Client SDK (JavaScript) to make database edits. 
When an edit happens, ScuttleKit makes corresponding changes to an underlying Sqlite database to remain in sync with the edits. In addition to updating the database, ScuttleKit will replicate the edits (as messages) across the Secure ScuttleButt (SSB) network. As a result, peers who receive these messages will also update their own local Sqlite databases to be in sync with everyone else.

All edits go into the SSB log as a message with type {app-name}, where app-name represents an identifier chosen for the app. Choosing unique identifiers (instead of a generic name) for your app during configuration is a good practice to reduce the occurence of naming conflicts.

If an app wants to read messages other than {app-name}, such as posts, about or contacts from the SSB log, it needs to request permissions from the user. Since these message types might contain sensitive data, the user is allowed to not share that information with your app. As of now, apps will only have read access to external data.

## Installation

If you're not in the Secure ScuttleButt network, you need to install ScuttleButt.

Based on your Operating System, use one of these links. Links go here...

If you're already on ScuttleButt, just install the scuttlekit plugin.

```bash
sbot plugins.install ssb-scuttlekit
```

You're all set to run ScuttleKit applications. The plugin starts a Web Sockets server on port 1103, which can be accessed from a webpage using the scuttlekit-client library. To learn how to create ScuttleKit Client Apps, go to https://github.com/jeswin/scuttlekit-sqlite

## ScuttleKit REST API

The ScuttleKit REST API is not meant to be called directly by application developers. Developers should use the ScuttleKit Client SDK mentioned above.

## Registration

GET /register

POST /db

POST /keychains

