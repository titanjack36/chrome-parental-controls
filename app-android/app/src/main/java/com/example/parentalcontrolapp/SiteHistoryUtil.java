package com.example.parentalcontrolapp;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;

import java.util.Locale;

import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class SiteHistoryUtil {

    private static SiteHistoryUtil instance;
    private OkHttpClient client;
    private String apiUrl = null;
    private String extensionId = null;

    private SiteHistoryUtil() {
        client = new OkHttpClient();
    }

    public static SiteHistoryUtil getInstance() {
        if (instance == null) {
            instance = new SiteHistoryUtil();
        }
        return instance;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public void setExtensionId(String extensionId) {
        this.extensionId = extensionId;
    }

    public void sendSiteHistoryRequest(DateTime startDt, DateTime endDt, Callback callback) throws Exception {
        if (apiUrl == null) {
            throw new Exception("API URL is not set.");
        }
        if (extensionId == null) {
            throw new Exception("Extension ID is not set");
        }
        DateTimeFormatter formatter = ISODateTimeFormat.dateTime();
        String reqUrl = String.format(
            Locale.getDefault(),
            "%s/timelog/getlog?startTime=%s&endTime=%s&extensionId=%s",
            apiUrl, formatter.print(startDt), formatter.print(endDt), extensionId);

        Request request = new Request.Builder()
            .url(reqUrl)
            .build();

        client.newCall(request).enqueue(callback);
    }
}
