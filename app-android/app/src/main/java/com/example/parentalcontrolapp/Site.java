package com.example.parentalcontrolapp;

import org.joda.time.DateTime;
import org.joda.time.Duration;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.PeriodFormatter;
import org.joda.time.format.PeriodFormatterBuilder;

public class Site {
    private String id;
    private DateTime startTime;
    private DateTime endTime;
    private String siteUrl;
    private int duration;
    private boolean isActive;

    public Site(String id, DateTime startTime, DateTime endTime, String siteUrl, int duration, boolean isActive) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.siteUrl = siteUrl;
        this.duration = duration;
        this.isActive = isActive;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public DateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(DateTime startTime) {
        this.startTime = startTime;
    }

    public DateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(DateTime endTime) {
        this.endTime = endTime;
    }

    public String getSiteUrl() {
        return siteUrl;
    }

    public void setSiteUrl(String siteUrl) {
        this.siteUrl = siteUrl;
    }

    public int getDuration() {
        return duration;
    }

    public void setDuration(int duration) {
        this.duration = duration;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getFormattedStartTime() {
        return DateTimeFormat.forPattern("hh:mm a").print(startTime);
    }

    public String getFormattedDuration() {
        return new PeriodFormatterBuilder()
            .appendHours()
            .appendSuffix("h")
            .appendSeparator(" ")
            .appendMinutes()
            .appendSuffix("m")
            .appendSeparator(" ")
            .appendSeconds()
            .appendSuffix("s")
            .toFormatter()
            .print(Duration.standardSeconds(this.duration).toPeriod());
    }
}
