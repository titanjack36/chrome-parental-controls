package com.example.parentalcontrolapp;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Response;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.datepicker.MaterialDatePicker;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.LocalDateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.ISODateTimeFormat;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;

public class SiteHistoryActivity extends AppCompatActivity {

    private static final String TAG = "SiteHistoryActivity";
    private SwipeRefreshLayout swipeRefresh;
    private RecyclerView siteHistoryList;
    private RelativeLayout errorContent;
    private DateTime selectedDate;
    private TextView dateText;
    RelativeLayout emptyListContent;

    private SiteHistoryListAdapter siteHistoryListAdapter;
    private SiteHistoryUtil siteHistoryUtil;
    private Handler handler;
    private Gson gson;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_site_history);

        selectedDate = new DateTime();
        dateText = findViewById(R.id.dateText);
        dateText.setText(String.format(getString(R.string.date_today),
                DateTimeFormat.forPattern("EEEE MMMM d").print(selectedDate)));

        siteHistoryUtil = SiteHistoryUtil.getInstance();
        try {
            ApplicationInfo ai = getPackageManager().getApplicationInfo(getPackageName(),
                    PackageManager.GET_META_DATA);
            Bundle bundle = ai.metaData;
            siteHistoryUtil.setApiUrl(bundle.getString(getString(R.string.api_url_name)));
            siteHistoryUtil.setExtensionId(bundle.getString(getString(R.string.ext_id_name)));
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "Unable to load API URL and/or extension ID: " + e.getMessage());
        }

        handler = new Handler(Looper.getMainLooper());
        gson = new GsonBuilder()
            .registerTypeAdapter(DateTime.class, new ISODateTimeAdapter())
            .create();
        siteHistoryListAdapter = new SiteHistoryListAdapter();

        siteHistoryList = findViewById(R.id.siteHistoryList);
        siteHistoryList.setAdapter(siteHistoryListAdapter);
        siteHistoryList.setLayoutManager(new LinearLayoutManager(this));

        DividerItemDecoration dividerItemDecoration =
                new DividerItemDecoration(siteHistoryList.getContext(), DividerItemDecoration.VERTICAL);
        siteHistoryList.addItemDecoration(dividerItemDecoration);

        errorContent = findViewById(R.id.errorContent);
        emptyListContent = findViewById(R.id.emptyListContent);

        swipeRefresh = findViewById(R.id.swipeRefresh);
        swipeRefresh.setOnRefreshListener(this::refreshList);

        swipeRefresh.setRefreshing(true);
        refreshList();
    }

    private final Callback refreshListCallback = new Callback() {
        @Override
        public void onFailure(final Call call, IOException e) {
            handler.post(() -> {
                Toast.makeText(SiteHistoryActivity.this, e.toString(), Toast.LENGTH_LONG).show();
                Log.e(TAG, "Failed to load site list: " + e.getMessage());
                showLoadError();
                swipeRefresh.setRefreshing(false);
            });
        }

        @Override
        public void onResponse(Call call, final Response response) throws IOException {
            String res = response.body().string();
            try {
                Site[] sites = gson.fromJson(res, Site[].class);
                handler.post(() -> {
                    if (sites.length == 0) {
                        TextView emptyListText = findViewById(R.id.emptyListText);
                        if (isDateToday(selectedDate)) {
                            emptyListText.setText(getString(R.string.empty_list_message_today));
                        } else {
                            emptyListText.setText(getString(R.string.empty_list_message));
                        }
                        emptyListContent.setVisibility(View.VISIBLE);
                    } else {
                        emptyListContent.setVisibility(View.INVISIBLE);
                    }

                    siteHistoryListAdapter.setSites(new ArrayList<>(Arrays.asList(sites)));
                    hideLoadError();
                    swipeRefresh.setRefreshing(false);
                });
            } catch (Exception e) {
                Log.e(TAG, "Failed to load site list: " + e.getMessage());
                handler.post(() -> {
                    showLoadError();
                    swipeRefresh.setRefreshing(false);
                });
            }
        }
    };

    public void refreshList(View view) {
        hideLoadError();
        swipeRefresh.setRefreshing(true);
        refreshList();
    }

    private void refreshList() {
        try {
            DateTime startDt = selectedDate.withTimeAtStartOfDay();
            DateTime endDt = selectedDate.millisOfDay().withMaximumValue();
            siteHistoryUtil.sendSiteHistoryRequest(startDt, endDt, refreshListCallback);
        } catch (Exception e) {
            Log.e(TAG, "Failed to load site list: " + e.getMessage());
            showLoadError();
            swipeRefresh.setRefreshing(false);
        }
    }

    private void showLoadError() {
        emptyListContent.setVisibility(View.INVISIBLE);
        siteHistoryList.setVisibility(View.INVISIBLE);
        errorContent.setVisibility(View.VISIBLE);
    }

    private void hideLoadError() {
        siteHistoryList.setVisibility(View.VISIBLE);
        errorContent.setVisibility(View.INVISIBLE);
    }

    public void showDatePicker(View view) {
        MaterialDatePicker.Builder<Long> builder = MaterialDatePicker.Builder.datePicker();
        builder.setTitleText("Change Date");
        builder.setSelection(selectedDate.getMillis());

        MaterialDatePicker<Long> materialDatePicker = builder.build();
        materialDatePicker.show(getSupportFragmentManager(), "DatePicker");
        materialDatePicker.addOnPositiveButtonClickListener(selection -> {
            // Since selection timezone is in UTC+0, it must be changed to the local timezone
            // so the timezone difference does not result in a different date being displayed
            selectedDate = (new LocalDateTime(selection, DateTimeZone.UTC)).toDateTime();
            String selectedDateStr = DateTimeFormat.forPattern("EEEE MMMM d").print(selectedDate);
            if (isDateToday(selectedDate)) {
                dateText.setText(String.format(getString(R.string.date_today), selectedDateStr));
            } else {
                dateText.setText(selectedDateStr);
            }
            refreshList();
        });
    }

    private boolean isDateToday(DateTime dt) {
        DateTime currentTime = new DateTime();
        return currentTime.toLocalDate().isEqual(dt.withZone(currentTime.getZone()).toLocalDate());
    }
}