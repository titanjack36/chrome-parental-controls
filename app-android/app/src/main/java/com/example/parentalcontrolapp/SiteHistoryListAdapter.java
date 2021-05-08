package com.example.parentalcontrolapp;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;

public class SiteHistoryListAdapter extends RecyclerView.Adapter<SiteHistoryListAdapter.ViewHolder> {

    private ArrayList<Site> sites = new ArrayList<>();

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.site_list_item, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Site site = sites.get(position);
        holder.startTime.setText(site.getFormattedStartTime());
        holder.siteUrl.setText(site.getSiteUrl());
        holder.duration.setText(site.getFormattedDuration());
        holder.activeBadge.setVisibility(site.isActive() ? View.VISIBLE : View.INVISIBLE);
    }

    @Override
    public int getItemCount() {
        return sites.size();
    }

    public void setSites(ArrayList<Site> sites) {
        this.sites = sites;
        notifyDataSetChanged();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        private final TextView startTime;
        private final TextView siteUrl;
        private final TextView duration;
        private final TextView activeBadge;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);

            startTime = itemView.findViewById(R.id.startTime);
            siteUrl = itemView.findViewById(R.id.siteUrl);
            duration = itemView.findViewById(R.id.duration);
            activeBadge = itemView.findViewById(R.id.activeBadge);
        }
    }
}
