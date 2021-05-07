package com.example.parentalcontrolapp;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;

import java.lang.reflect.Type;

public class ISODateTimeAdapter implements JsonSerializer<DateTime>, JsonDeserializer<DateTime> {

    private static final DateTimeFormatter parser = ISODateTimeFormat.dateTimeParser();
    private static final DateTimeFormatter formatter = ISODateTimeFormat.dateTime();

    @Override
    public DateTime deserialize(JsonElement json, Type typeOfT,
                                JsonDeserializationContext context) throws JsonParseException {
        return parser.parseDateTime(json.getAsString());
    }

    @Override
    public JsonElement serialize(DateTime src, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(formatter.print(src));
    }
}
