package com.example.parentalcontrolapp;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;

public class Site {
    private String id = null;
    private DateTime startTime = null;
    private DateTime endTime = null;
    private String siteUrl = null;
    private String duration = null;

    public Site(DateTime startTime, DateTime endTime, String siteUrl, String duration) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.siteUrl = siteUrl;
        this.duration = duration;
    }

    public DateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(DateTime startTime) {
        this.startTime = startTime;
    }

    public String getSiteUrl() {
        return siteUrl;
    }

    public void setSiteUrl(String siteUrl) {
        this.siteUrl = siteUrl;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public DateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(DateTime endTime) {
        this.endTime = endTime;
    }

    public String getFormattedStartTime() {
        return DateTimeFormat.forPattern("hh:mm a").print(startTime);
    }
}
