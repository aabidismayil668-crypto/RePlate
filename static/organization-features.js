(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const api = () => window.RePlateApp;
  const state = () => api()?.data;
  const current = () => api()?.user();
  const isAdmin = () => current()?.role === 'admin';
  const date = value => value ? new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : '—';
  const normalizeSearch = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim().replace(/\s+/g,' ');
  const safeExternalUrl = value => { try { const parsed = new URL(String(value || '')); return ['https:','http:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
  const safeImageData = value => /^data:image\/(?:jpeg|png|webp);base64,/i.test(String(value || '')) ? String(value) : '';
  const uid = () => Math.random().toString(36).slice(2,10);
  const typeName = type => type === 'donor' ? 'Food donor' : type === 'admin' ? 'Administrator' : 'Recipient organization';
  const accountOrgType = role => role === 'donor' ? 'donor' : ['recipient','ngo'].includes(role) ? 'recipient' : '';
  const statusText = value => String(value || '').replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
  const button = (label, action, cls = 'button button-small') => `<button type="button" class="${cls}" data-action="${action}">${label}</button>`;
  const pill = value => `<span class="org-pill ${esc(value)}">${esc(statusText(value))}</span>`;
  const records = () => state()?.organizations || [];
  const requests = () => state()?.organizationRequests || [];
  const byId = id => records().find(org => org.id === id);
  const orgSort = rows => [...rows].sort((a,b) => (a.org_type === b.org_type ? a.name.localeCompare(b.name) : a.org_type === 'donor' ? -1 : 1));

  function accessGate() {
    const u = current();
    return `<div class="empty-state access-gate"><span>◌</span><div class="eyebrow">ORGANIZATION ACCESS</div><h2>Link and verify your organization first.</h2><p>${esc(u?.org || 'Your organization')} needs an approved directory affiliation before it can use donation operations.</p><a href="#organizations" class="button">Find your organization →</a></div>`;
  }

  function directoryPage(initialType = 'all') {
    const orgs = orgSort(records());
    const donorCount = orgs.filter(org => org.org_type === 'donor').length;
    const recipientCount = orgs.length - donorCount;
    const u = current();
    let newOrgNotice = '';
    if (!u) newOrgNotice = `<div class="org-new-request notice"><b>Organization not listed?</b><span>Sign in with a donor or recipient account to ask the administrator to add it.</span><a class="button button-small" href="#login">Sign in to request →</a></div>`;
    else if (accountOrgType(u.role)) {
      const pending = requests().some(req => req.user_id === u.id && req.status === 'pending');
      if (pending) newOrgNotice = `<div class="org-new-request notice"><b>Your organization request is pending.</b><span>The administrator will review the directory details and access request.</span></div>`;
      else if (u.organizationId) newOrgNotice = `<div class="org-new-request notice"><b>Your account is linked to an organization.</b><span>Contact an administrator if you need to change the organization linked to this account.</span></div>`;
      else newOrgNotice = `<div class="org-new-request notice"><b>Can’t find your organization?</b><span>Request that the administrator add a donor or recipient organization to the directory.</span><a class="button button-small" href="#new-organization-request">Request a new organization →</a></div>`;
    }
    return `<div class="org-page"><div class="org-hero"><div><span class="eyebrow">KANNUR DISTRICT / PUBLIC DIRECTORY</span><h1>Local organizations,<br><em>one shared network.</em></h1><p>Explore food businesses and community organizations with source notes. Public facts, operational eligibility, and participation approval are tracked separately.</p></div><div class="org-counts"><b>${orgs.length}</b><span>listed organizations</span><div><strong>${donorCount}</strong> food businesses <i>·</i> <strong>${recipientCount}</strong> community groups</div></div></div>${newOrgNotice}<div class="org-directory-tools"><label class="search-box"><span>⌕</span><input id="org-search" type="search" placeholder="Search name, town, or category"></label><select id="org-type-filter"><option value="all" ${initialType==='all'?'selected':''}>All organization types</option><option value="donor" ${initialType==='donor'?'selected':''}>Food businesses</option><option value="recipient" ${initialType==='recipient'?'selected':''}>Community organizations</option></select><select id="org-town-filter"><option value="all">All Kannur locations</option>${[...new Set(orgs.map(org=>org.town).filter(Boolean))].sort().map(town=>`<option>${esc(town)}</option>`).join('')}</select></div><div class="org-results-head"><span id="org-result-count">${orgs.length} organizations</span><span>Source checked · participation not implied</span></div><div class="org-grid" id="org-grid">${orgs.map(org=>orgCard(org)).join('')}</div><p class="org-no-results" id="org-no-results" hidden>No organizations match those filters.</p><div class="org-disclaimer"><b>How to read this directory</b><p>“Verified” refers only to the public facts listed on each profile. It does not mean the organization has surplus food, accepts donations, is eligible to participate, or has approved a RePlate account.</p></div></div>`;
  }
  function newOrganizationForm() {
    const u = current();
    if (!u) return `<div class="empty-state"><h2>Sign in to request an organization</h2><p>Use a donor or recipient account to submit a new directory organization.</p><a href="#login" class="button">Sign in →</a></div>`;
    if (!accountOrgType(u.role)) return `<div class="empty-state"><h2>Donor or recipient account required</h2><a href="#organizations" class="button">Back to directory</a></div>`;
    if (u.organizationId || requests().some(req => req.user_id === u.id && req.status === 'pending')) return `<div class="empty-state"><h2>An organization request is already linked to this account.</h2><p>Wait for the administrator to review it, or contact the administrator if your organization link needs to change.</p><a href="#organizations" class="button">Back to directory</a></div>`;
    const orgType = accountOrgType(u.role);
    return `<div class="form-page-head"><a class="back-link" href="#organizations">← Back to organizations</a><div class="eyebrow">DIRECTORY / NEW ORGANIZATION</div><h1>Request a new<br><em>organization listing.</em></h1><p>Submit your organization details for administrator review. Adding it to the directory does not grant posting or food-request access until the review is complete.</p></div><form class="listing-form org-new-form" data-form="new-organization" data-org-type="${orgType}"><section class="form-section"><div class="form-section-title"><span>01</span><div><b>Organization details</b><small>Your account role determines the organization type.</small></div></div><div class="form-grid"><div class="form-callout wide"><span>✓</span><p>Submitting as <b>${esc(typeName(orgType))}</b> for <b>${esc(u.org)}</b>.</p></div><label class="wide">Organization name *<input name="name" required maxlength="120" placeholder="Registered or commonly used name"></label><label>Category *<input name="category" required maxlength="100" placeholder="Restaurant, pantry, community group"></label><label>Town / area *<input name="town" required maxlength="100" placeholder="Town or locality"></label><label class="wide">Street address<input name="address" maxlength="240" placeholder="Public organization address"></label></div></section><section class="form-section"><div class="form-section-title"><span>02</span><div><b>Public contact and source</b><small>Optional details help the administrator review the listing.</small></div></div><div class="form-grid"><label>Public phone<input name="public_phone" type="tel" maxlength="40" placeholder="Organization contact number"></label><label>Public email<input name="public_email" type="email" maxlength="160" placeholder="contact@organization.org"></label><label class="wide">Official website<input name="website" type="url" maxlength="240" placeholder="https://example.org"></label><label class="wide">Note to the administrator<textarea name="message" rows="3" maxlength="1000" placeholder="Anything that helps identify or review this organization"></textarea></label></div></section><section class="form-section"><div class="form-section-title"><span>03</span><div><b>Authorization</b><small>The administrator reviews public facts and operational eligibility before enabling account access.</small></div></div><div class="form-grid"><label class="consent-check wide"><input type="checkbox" name="consent" value="yes" required><span>I am authorized to submit this organization and consent to its details being reviewed for the RePlate directory and participation request.</span></label><div class="form-callout wide"><span>!</span><p>New organizations are added as unverified. The administrator must verify public details and eligibility before approving your donor or recipient access.</p></div></div></section><div class="form-submit"><span>* Required fields</span><button class="button">Send to administrator →</button></div></form>`;
  }
  function orgCard(org) {
    const town = org.town || org.district || 'Kannur district';
    const search = normalizeSearch(`${org.name} ${org.category} ${town} ${org.address || ''}`);
    const photo = safeImageData(org.photo_data);
    return `<article class="org-card" data-type="${esc(org.org_type)}" data-town="${esc(org.town || '')}" data-search="${esc(search)}">${photo?`<img class="org-card-photo" src="${esc(photo)}" alt="Photo of ${esc(org.name)}" loading="lazy">`:''}<div class="org-card-top"><span class="org-type ${esc(org.org_type)}">${esc(typeName(org.org_type))}</span>${pill(org.verification_status)}</div><h3>${esc(org.name)}</h3><p class="org-category">${esc(org.category || 'Community organization')}</p><div class="org-location">⌖ ${esc(town)}</div><div class="org-card-status"><span>Participation</span>${pill(org.participation_status)}</div><a class="org-card-link" href="#organization/${encodeURIComponent(org.id)}">View source notes & details <b>↗</b></a></article>`;
  }
  function sourceList(items) {
    if (!Array.isArray(items) || !items.length) return '<li>No details recorded.</li>';
    return items.map(item => `<li>${esc(typeof item === 'string' ? item : (item.fact || item.text || JSON.stringify(item)))}</li>`).join('');
  }
  function organizationDetail(id) {
    const org = byId(decodeURIComponent(id));
    if (!org) return `<div class="empty-state"><h2>Organization not found</h2><a href="#organizations" class="button">Back to directory</a></div>`;
    const u = current();
    const roleMatches = u && accountOrgType(u.role) === org.org_type;
    const myRequest = u && requests().find(req => req.organization_id === org.id && req.user_id === u.id);
    const fields = [
      ['Address',org.address],['Public phone',org.public_phone],['Public email',org.public_email],['Website',org.website],
      ['Food categories',org.food_categories],['Dietary options',org.dietary_options],['Opening hours',org.opening_hours],
      ['Service area',org.service_area],['Accepted food categories',org.accepted_food_categories],
      ['Collection capacity',org.collection_capacity],['Operating schedule',org.operating_schedule],['Registration details',org.registration_details]
    ].filter(([,value]) => value);
    const claim = !u ? `<div class="org-claim notice"><b>Want to participate?</b><span>Sign in with a donor or recipient account, then request affiliation with this organization.</span><a href="#login">Sign in →</a></div>`
      : !roleMatches ? `<div class="org-claim notice"><b>Role does not match this listing.</b><span>Create or use a ${esc(typeName(org.org_type).toLowerCase())} account to request this affiliation.</span></div>`
      : myRequest?.status === 'approved' && u.organizationId === org.id ? `<div class="org-claim verified-badge">✓ Your account is approved for this organization.</div>`
      : myRequest?.status === 'pending' ? `<div class="org-claim pending-badge">${myRequest.directory_added_at ? 'Your organization is in the directory. The administrator is reviewing its details and eligibility before enabling account access.' : 'Your affiliation request is waiting for administrator review.'}</div>`
      : `<form class="org-claim-form" data-form="organization-request" data-organization-id="${esc(org.id)}"><span class="eyebrow">REQUEST ORGANIZATION ACCESS</span><p>Approval requires public fact review, operational eligibility review, an authorized representative, and explicit participation consent.</p><label>Message to the coordinator<textarea name="message" rows="2" placeholder="Your role and how your organization plans to participate"></textarea></label><label class="consent-check"><input type="checkbox" name="consent" value="yes" required><span>I am authorized to request this affiliation and consent to this organization joining the RePlate food recovery network.</span></label><button class="button">Submit for review →</button></form>`;
    return `<div class="org-detail-page"><a href="#organizations" class="back-link">← Back to directory</a><div class="org-detail-heading"><div><span class="org-type ${esc(org.org_type)}">${esc(typeName(org.org_type))}</span><h1>${esc(org.name)}</h1><p>${esc(org.category)} · ${esc(org.town || org.district)}</p></div><div class="org-status-stack">${pill(org.verification_status)}${pill(org.eligibility_status)}${pill(org.registration_status)}${pill(org.participation_status)}</div></div><div class="org-detail-grid"><main><section class="org-detail-section"><span class="eyebrow">PUBLIC INFORMATION</span><div class="org-fact-grid">${fields.map(([label,value])=>`<div><small>${esc(label)}</small><b>${esc(value)}</b></div>`).join('') || '<p>No public contact details are listed.</p>'}</div></section><section class="org-detail-section"><span class="eyebrow">FACTS CHECKED</span><ul>${sourceList(org.verified_information)}</ul><span class="eyebrow unknown-title">NOT CONFIRMED</span><ul>${sourceList(org.unknown_information)}</ul></section><section class="org-source"><span class="eyebrow">SOURCE & REVIEW</span><p><b>${esc(org.source_name)}</b> · checked ${esc(date(org.source_checked_at))}</p>${safeExternalUrl(org.source_url) ? `<a href="${esc(safeExternalUrl(org.source_url))}" target="_blank" rel="noopener noreferrer">Open source ↗</a>` : '<span>No source link submitted.</span>'}${org.verification_notes ? `<p>${esc(org.verification_notes)}</p>` : ''}</section></main><aside><div class="org-detail-section org-eligibility"><span class="eyebrow">PARTICIPATION STATUS</span><h3>${esc(statusText(org.participation_status))}</h3><p>Public listing and public-fact verification do not establish food-recovery eligibility or participation consent.</p>${claim}</div>${isAdmin()?`<a href="#admin-org-edit/${encodeURIComponent(org.id)}" class="button button-outline full-button">Review directory record →</a>`:''}</aside></div></div>`;
  }
  function accessRequestsPage() {
    if (!isAdmin()) return `<div class="empty-state"><h2>Administrator access required</h2><a href="#dashboard" class="button">Back to workspace</a></div>`;
    const rows = [...requests()].sort((a,b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1));
    return `<div class="workspace-head"><div><div class="eyebrow">ADMIN / ORGANIZATION ACCESS</div><h1>Affiliation requests</h1><p class="muted">Verify public facts, eligibility, representative authority, and consent before approving operational access.</p></div><a href="#admin-organizations" class="button button-outline">Directory records</a></div><div class="metric-row"><div class="metric"><span>PENDING</span><b>${rows.filter(x=>x.status==='pending').length}</b></div><div class="metric"><span>APPROVED</span><b>${rows.filter(x=>x.status==='approved').length}</b></div><div class="metric"><span>REJECTED</span><b>${rows.filter(x=>x.status==='rejected').length}</b></div><div class="metric metric-note"><span>APPROVAL GATE</span><b>4 checks</b><small>Verified · eligible · role match · consent</small></div></div><div class="org-request-list">${rows.map(req=>requestCard(req)).join('')||'<div class="subtle-empty">No organization access requests have been submitted.</div>'}</div>`;
  }
  function requestCard(req) {
    const user = state().users.find(x=>x.id===req.user_id);
    if (!user) return '';
    if (req.request_type === 'new_organization' && !req.organization_id) {
      const proposal = req.proposed_organization;
      if (!proposal) return '';
      const sourceUrl = safeExternalUrl(proposal.website);
      const photo = safeImageData(proposal.photo_data);
      return `<article class="org-request-card"><div class="org-request-main"><div class="org-request-title"><div><span class="eyebrow">NEW ${esc(typeName(proposal.org_type).toUpperCase())} / ${esc(proposal.town || 'LOCATION NOT PROVIDED')}</span><h3>${esc(proposal.name)}</h3></div>${pill(req.status)}</div>${photo?`<img class="org-request-photo" src="${esc(photo)}" alt="Submitted photo of ${esc(proposal.name)}" loading="lazy">`:''}<div class="org-request-facts"><span>Requested by <b>${esc(user.name)}</b></span><span>${esc(user.email)}</span><span>Account role: ${esc(typeName(user.role))} ${accountOrgType(user.role)===proposal.org_type?'✓':'⚠ mismatch'}</span><span>Category: ${esc(proposal.category)}</span><span>Town: ${esc(proposal.town)}</span><span>Consent: ${req.consent_confirmed?'confirmed':'not recorded'}</span>${proposal.address?`<span>Address: ${esc(proposal.address)}</span>`:''}${proposal.public_phone?`<span>Public phone: ${esc(proposal.public_phone)}</span>`:''}${proposal.public_email?`<span>Public email: ${esc(proposal.public_email)}</span>`:''}</div>${sourceUrl?`<p><a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">Review submitted website ↗</a></p>`:''}<p>${esc(req.message || 'No note from requester.')}</p><p class="org-admin-note">Adding this record does not approve operational access. Verify public facts and eligibility, then approve the affiliation request.</p></div>${req.status==='pending'?`<div class="org-request-actions">${button('Add to directory for review',`org-add-new-${req.id}`,'button button-small')}${button('Reject','org-reject-'+req.id,'text-button')}</div>`:''}</article>`;
    }
    const org = byId(req.organization_id);
    if (!org) return '';
    const roleMatch = accountOrgType(user.role) === org.org_type, canApprove = roleMatch && req.consent_confirmed && org.verification_status === 'verified' && org.eligibility_status === 'eligible' && org.verification_status !== 'inactive';
    const stageNote = req.directory_added_at ? `<p class="org-admin-note">Added to the directory on ${esc(date(req.directory_added_at))}; verify public facts and eligibility before enabling account access.</p>` : '';
    return `<article class="org-request-card"><div class="org-request-main"><div class="org-request-title"><div><span class="eyebrow">${esc(typeName(org.org_type))} / ${esc(org.town || 'Kannur')}</span><h3>${esc(org.name)}</h3></div>${pill(req.status)}</div><div class="org-request-facts"><span>Requested by <b>${esc(user.name)}</b></span><span>${esc(user.email)}</span><span>Account role: ${esc(typeName(user.role))} ${roleMatch?'✓':'⚠ mismatch'}</span><span>Consent: ${req.consent_confirmed?'confirmed':'not recorded'}</span><span>Public facts: ${esc(statusText(org.verification_status))}</span><span>Eligibility: ${esc(statusText(org.eligibility_status))}</span></div><p>${esc(req.message || 'No message from requester.')}</p>${stageNote}<a href="#organization/${encodeURIComponent(org.id)}">Review source notes →</a>${req.admin_notes?`<p class="org-admin-note">Coordinator note: ${esc(req.admin_notes)}</p>`:''}</div>${req.status==='pending'?`<div class="org-request-actions">${button(canApprove?'Approve access':'Requirements incomplete',`org-approve-${req.id}`,`button button-small ${canApprove?'':'button-disabled'}`)}${button('Reject',`org-reject-${req.id}`,'text-button')}</div>`:''}</article>`;
  }
  function adminDirectoryPage() {
    if (!isAdmin()) return `<div class="empty-state"><h2>Administrator access required</h2><a href="#dashboard" class="button">Back to workspace</a></div>`;
    const orgs = orgSort(records());
    return `<div class="workspace-head"><div><div class="eyebrow">ADMIN / SOURCE-TRACEABLE DIRECTORY</div><h1>Organization directory</h1><p class="muted">Review source-backed facts, eligibility, and registration independently.</p></div><div class="org-admin-actions"><a class="button button-outline" href="#organization-requests">Access requests</a>${button('Export CSV','org-export','button')}</div></div><div class="metric-row"><div class="metric"><span>ORGANIZATIONS</span><b>${orgs.length}</b></div><div class="metric"><span>VERIFIED PUBLIC RECORDS</span><b>${orgs.filter(x=>x.verification_status==='verified').length}</b></div><div class="metric"><span>ELIGIBLE</span><b>${orgs.filter(x=>x.eligibility_status==='eligible').length}</b></div><div class="metric metric-note"><span>CONSENT</span><b>${orgs.filter(x=>x.participation_status==='participating').length} participating</b><small>Imported records begin without participation consent.</small></div></div><div class="org-directory-tools"><label class="search-box"><span>⌕</span><input id="admin-org-search" type="search" placeholder="Search organizations"></label><select id="admin-org-type"><option value="all">All types</option><option value="donor">Food businesses</option><option value="recipient">Community organizations</option></select><select id="admin-org-status"><option value="all">All verification statuses</option><option value="verified">Verified facts</option><option value="unverified">Unverified</option><option value="inactive">Inactive</option></select></div><div class="org-grid" id="admin-org-grid">${orgs.map(org=>`<article class="org-card admin-org-card" data-type="${esc(org.org_type)}" data-status="${esc(org.verification_status)}" data-search="${esc(`${org.name} ${org.category} ${org.town||''}`.toLowerCase())}"><div class="org-card-top"><span class="org-type ${esc(org.org_type)}">${esc(typeName(org.org_type))}</span>${pill(org.verification_status)}</div><h3>${esc(org.name)}</h3><p class="org-category">${esc(org.category)}</p><div class="org-admin-statuses">${pill(org.eligibility_status)}${pill(org.registration_status)}${pill(org.participation_status)}</div><small>${esc(org.source_name)} · ${esc(date(org.source_checked_at))}</small><a class="org-card-link" href="#admin-org-edit/${encodeURIComponent(org.id)}">Review record →</a></article>`).join('')}</div><p class="org-no-results" id="admin-org-empty" hidden>No organizations match those filters.</p>`;
  }
  function adminOrganizationEdit(id) {
    if (!isAdmin()) return `<div class="empty-state"><h2>Administrator access required</h2></div>`;
    const org=byId(decodeURIComponent(id)); if(!org)return `<div class="empty-state"><h2>Organization not found</h2><a href="#admin-organizations">Back</a></div>`;
    const options=(values,current)=>values.map(value=>`<option value="${value}" ${current===value?'selected':''}>${esc(statusText(value))}</option>`).join('');
    return `<div class="form-page-head"><a href="#organization/${encodeURIComponent(org.id)}" class="back-link">← Back to public record</a><div class="eyebrow">ADMIN / DIRECTORY RECORD</div><h1>${esc(org.name)}</h1><p>${esc(org.source_name)} · ${safeExternalUrl(org.source_url) ? `<a href="${esc(safeExternalUrl(org.source_url))}" target="_blank" rel="noopener noreferrer">Open source ↗</a>` : '<span>No source link submitted.</span>'}</p></div><form class="listing-form org-edit-form" data-form="directory-edit" data-organization-id="${esc(org.id)}"><section class="form-section"><div class="form-section-title"><span>01</span><div><b>Review status</b><small>Public fact verification and operational eligibility are separate checks.</small></div></div><div class="form-grid"><label>Public-fact verification<select name="verification_status">${options(['unverified','pending_verification','verified','rejected','inactive'],org.verification_status)}</select></label><label>Operational eligibility<select name="eligibility_status">${options(['unassessed','pending_review','eligible','ineligible'],org.eligibility_status)}</select></label><label class="wide">Verification date<input type="date" name="verification_date" value="${esc(org.verification_date||'')}"></label><label class="wide">Verification outcome<input name="verification_outcome" value="${esc(org.verification_outcome||'')}" placeholder="Facts checked and outcome"></label><label class="wide">Verification notes<textarea name="verification_notes" rows="3">${esc(org.verification_notes||'')}</textarea></label><label class="wide">Eligibility notes<textarea name="eligibility_notes" rows="3">${esc(org.eligibility_notes||'')}</textarea></label></div></section><section class="form-section"><div class="form-section-title"><span>02</span><div><b>Participation safeguards</b><small>Account approval requires a separate request with recorded consent.</small></div></div><div class="org-review-summary"><p><b>Registration:</b> ${esc(statusText(org.registration_status))}</p><p><b>Participation:</b> ${esc(statusText(org.participation_status))}</p><p>These fields change only when an authorized organization access request is approved. Editing source facts does not grant account access.</p></div></section><div class="form-submit"><a href="#admin-organizations" class="text-button">Cancel</a><button class="button">Save review status →</button></div></form>`;
  }
  function accountsPage() {
    if(!isAdmin())return `<div class="empty-state"><h2>Administrator access required</h2></div>`;
    const users=state().users;
    return `<div class="workspace-head"><div><div class="eyebrow">ADMIN / REGISTERED ACCOUNTS</div><h1>Account directory</h1><p class="muted">Search registered users and review their role and approved organization access.</p></div></div><div class="org-directory-tools"><label class="search-box"><span>⌕</span><input id="account-search" type="search" placeholder="Search name, email, organization"></label><select id="account-role"><option value="all">All roles</option><option value="donor">Donors</option><option value="recipient">Recipients</option><option value="admin">Administrators</option></select><select id="account-access"><option value="all">All access states</option><option value="approved">Approved</option><option value="pending">Pending approval</option></select></div><div class="org-table-wrap"><table class="org-table" id="accounts-table"><thead><tr><th>Name</th><th>Organization</th><th>Phone</th><th>Email</th><th>Role</th><th>Access</th></tr></thead><tbody>${users.map(u=>`<tr data-role="${esc(u.role==='ngo'?'recipient':u.role)}" data-access="${u.role==='admin'||u.accessApproved?'approved':'pending'}" data-search="${esc(`${u.name} ${u.email} ${u.org}`.toLowerCase())}"><td>${esc(u.name)}</td><td>${esc(u.org)}${u.organizationId?`<small>${esc(byId(u.organizationId)?.name||'')}</small>`:''}</td><td>${esc(u.phone||'—')}</td><td>${esc(u.email)}</td><td>${esc(typeName(u.role==='ngo'?'recipient':u.role))}</td><td>${pill(u.role==='admin'||u.accessApproved?'approved':'pending')}</td></tr>`).join('')}</tbody></table></div><p id="account-empty" class="org-no-results" hidden>No accounts match those filters.</p>`;
  }
  function listingsPage() {
    if(!isAdmin())return `<div class="empty-state"><h2>Administrator access required</h2></div>`;
    const listings=state().listings;
    return `<div class="workspace-head"><div><div class="eyebrow">ADMIN / DONATION RECORDS</div><h1>Searchable listing records</h1><p class="muted">Review availability and flag concerns for human review.</p></div></div><div class="org-directory-tools"><label class="search-box"><span>⌕</span><input id="listing-search-admin" type="search" placeholder="Search food, donor, or location"></label><select id="listing-status-admin"><option value="all">All statuses</option>${['Available','Reserved','Picked Up','Expired','Cancelled','Flagged for Review'].map(x=>`<option>${x}</option>`).join('')}</select><select id="listing-type-admin"><option value="all">All food types</option>${['Prepared meals','Bakery','Produce','Dairy','Other'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="org-grid" id="listing-admin-grid">${listings.map(l=>{const donor=state().users.find(u=>u.id===l.donorId);return `<article class="org-card admin-listing-card" data-status="${esc(l.status)}" data-type="${esc(l.category)}" data-search="${esc(`${l.item} ${donor?.org||''} ${l.location}`.toLowerCase())}"><div class="org-card-top"><span class="listing-tag">${esc(l.category)}</span>${pill(l.status)}</div><h3>${esc(l.item)}</h3><p>${esc(l.quantity)} · ${esc(donor?.org||'Donor')}</p><small>Pickup by ${esc(new Date(l.deadline).toLocaleString())}</small><a class="org-card-link" href="#listing/${l.id}">Open listing →</a><div class="org-record-actions">${l.status==='Flagged for Review'?button('Clear flag',`org-clear-listing-${l.id}`,'text-button'):!['Picked Up','Cancelled','Expired'].includes(l.status)?button('Flag for review',`org-flag-listing-${l.id}`,'button button-small button-danger'):''}</div></article>`}).join('')}</div><p id="listing-admin-empty" class="org-no-results" hidden>No donations match those filters.</p>`;
  }

  function applyCards(gridId, searchId, typeId, statusId, emptyId, countId) {
    const grid=$(`#${gridId}`); if(!grid)return;
    const term=normalizeSearch($(`#${searchId}`)?.value);
    const type=$(`#${typeId}`)?.value||'all';
    const status=$(`#${statusId}`)?.value||'all';
    let count=0;
    [...grid.children].forEach(card=>{const show=(!term||normalizeSearch(card.dataset.search).includes(term))&&(type==='all'||card.dataset.type===type)&&(status==='all'||card.dataset.status===status);card.hidden=!show;if(show)count++;});
    const empty=$(`#${emptyId}`);if(empty)empty.hidden=count!==0;
    const countNode=countId&&$(`#${countId}`);if(countNode)countNode.textContent=`${count} organizations`;
  }
  function afterRender(route) {
    if(route.startsWith('organizations')){
      ['org-search','org-type-filter','org-town-filter'].forEach(id=>{const node=$(`#${id}`);node?.addEventListener('input',()=>{const grid=$('#org-grid'), term=normalizeSearch($('#org-search').value),type=$('#org-type-filter').value,town=$('#org-town-filter').value;let n=0;[...grid.children].forEach(card=>{const show=(!term||normalizeSearch(card.dataset.search).includes(term))&&(type==='all'||card.dataset.type===type)&&(town==='all'||card.dataset.town===town);card.hidden=!show;if(show)n++;});$('#org-no-results').hidden=n!==0;$('#org-result-count').textContent=`${n} organizations`;});node?.addEventListener('change',()=>node.dispatchEvent(new Event('input')));});
      $('#org-type-filter')?.dispatchEvent(new Event('input'));
    }
    if(route==='admin-organizations'){
      const apply=()=>applyCards('admin-org-grid','admin-org-search','admin-org-type','admin-org-status','admin-org-empty');
      ['admin-org-search','admin-org-type','admin-org-status'].forEach(id=>{$(`#${id}`)?.addEventListener('input',apply);$(`#${id}`)?.addEventListener('change',apply);});
    }
    if(route==='admin-accounts'){
      const apply=()=>{const term=normalizeSearch($('#account-search').value),role=$('#account-role').value,access=$('#account-access').value;let count=0;[...$('#accounts-table').tBodies[0].rows].forEach(row=>{const show=(!term||normalizeSearch(row.dataset.search).includes(term))&&(role==='all'||row.dataset.role===role)&&(access==='all'||row.dataset.access===access);row.hidden=!show;if(show)count++;});$('#account-empty').hidden=count!==0;};['account-search','account-role','account-access'].forEach(id=>{$(`#${id}`)?.addEventListener('input',apply);$(`#${id}`)?.addEventListener('change',apply);});
    }
    if(route==='admin-listings'){
      const apply=()=>applyCards('listing-admin-grid','listing-search-admin','listing-type-admin','listing-status-admin','listing-admin-empty');
      ['listing-search-admin','listing-status-admin','listing-type-admin'].forEach(id=>{$(`#${id}`)?.addEventListener('input',apply);$(`#${id}`)?.addEventListener('change',apply);});
    }
    if(route==='dashboard'){
      const u=current(); if(u&&u.role!=='admin'&&!u.accessApproved){const layout=$('.workspace-head'),notice=document.createElement('div');notice.className='notice org-access-notice';notice.innerHTML=`<b>Organization access is pending.</b><span>Request affiliation with a directory organization and wait for an administrator to review consent and eligibility.</span><a href="#organizations">Find your organization →</a>`;layout?.after(notice);$('.workspace-head .button')?.remove();}
      if(u?.role==='recipient'&&!$('.ngo-directory-panel')){const panel=document.createElement('section');panel.className='ngo-directory-panel';const orgs=orgSort(records().filter(org=>org.org_type==='recipient'));panel.innerHTML=`<div class="ngo-directory-head"><div><span class="eyebrow">COMMUNITY ORGANIZATIONS / KANNUR</span><h2>Find your organization</h2><p>Browse the community directory and request an affiliation to connect your account.</p></div><a class="button button-outline" href="#organizations?type=recipient">View full directory →</a></div><label class="search-box ngo-directory-search"><span>⌕</span><input id="ngo-org-search" type="search" placeholder="Search community organizations"></label><div class="ngo-org-list">${orgs.map(org=>`<a class="ngo-org-item" data-search="${esc(normalizeSearch(`${org.name} ${org.town||''} ${org.category||''}`))}" href="#organization/${encodeURIComponent(org.id)}"><span><b>${esc(org.name)}</b><small>${esc(org.category||'Community organization')} · ${esc(org.town||'Kannur')}</small></span><span>View →</span></a>`).join('')||'<p>No community organizations are available in the directory.</p>'}</div><p class="ngo-org-empty" hidden>No community organizations match that search.</p>`;$('.recipient-layout')?.before(panel);const input=$('#ngo-org-search');input?.addEventListener('input',()=>{const term=normalizeSearch(input.value);let visible=0;$$('.ngo-org-item').forEach(item=>{const show=!term||normalizeSearch(item.dataset.search).includes(term);item.hidden=!show;if(show)visible++;});$('.ngo-org-empty').hidden=visible!==0;});}
      if(u?.role==='admin'&&!$('.admin-quicklinks')){const head=$('.workspace-head');if(head){const links=document.createElement('div');links.className='admin-quicklinks';links.innerHTML='<a href="#organization-requests">Access requests</a><a href="#admin-organizations">Organization directory</a><a href="#admin-accounts">Accounts</a><a href="#admin-listings">Donation records</a>';head.after(links);}}
    }
    if(route.startsWith('listing/')){
      const u=current(),id=route.slice('listing/'.length),listing=state().listings.find(x=>x.id===id);
      if(listing&&listing.latitude!==null&&listing.latitude!==undefined&&listing.longitude!==null&&listing.longitude!==undefined&&!$('.location-map-link')){const block=$('.location-block');if(block){const link=document.createElement('a'),lat=Number(listing.latitude),lon=Number(listing.longitude);link.className='location-map-link';link.href=`https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=16/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open pickup pin in map ↗';block.append(link);}}
      if(u?.role==='donor'&&listing?.donorId===u.id&&['Available','Expired'].includes(listing.status)&&!$('[data-org-cancel]')){const box=$('.detail-heading');if(box){const b=document.createElement('button');b.type='button';b.className='button button-danger button-small';b.dataset.action=`org-cancel-listing-${listing.id}`;b.dataset.orgCancel='true';b.textContent='Cancel listing';box.append(b);}}
    }
  }

  function adminCsv() {
    const columns=['id','name','org_type','category','district','town','address','public_phone','public_email','website','source_name','source_url','source_checked_at','verification_status','eligibility_status','registration_status','participation_status'];
    const csv=[columns.join(','),...orgSort(records()).map(org=>columns.map(key=>`"${String(org[key]??'').replaceAll('"','""')}"`).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='replate-kannur-organizations.csv';a.click();URL.revokeObjectURL(url);
  }
  function handleClick(event) {
    const btn=event.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action, app=api(),d=state(),u=current();
    if(action==='org-export'){event.preventDefault();event.stopImmediatePropagation();if(isAdmin())adminCsv();return;}
    if(action.startsWith('org-approve-')||action.startsWith('org-reject-')){
      event.preventDefault();event.stopImmediatePropagation();if(!isAdmin())return;
      const approve=action.startsWith('org-approve-'),requestId=action.slice(approve?12:11),req=d.organizationRequests.find(x=>x.id===requestId&&x.status==='pending');if(!req)return;
      if(!approve&&req.request_type==='new_organization'&&!req.organization_id){
        req.status='rejected';req.reviewed_by=u.id;req.updated_at=new Date().toISOString();
        const applicant=d.users.find(x=>x.id===req.user_id),proposal=req.proposed_organization;
        app.log(`Rejected new organization proposal for ${proposal?.name||'organization'}`);app.save();app.render();app.flash(`New organization request from ${applicant?.name||'applicant'} rejected.`);return;
      }
      const org=byId(req.organization_id),account=d.users.find(x=>x.id===req.user_id),reason=[];
      if(!org||!account)return;if(accountOrgType(account.role)!==org.org_type)reason.push('account role does not match');if(!req.consent_confirmed)reason.push('consent is missing');if(org.verification_status!=='verified')reason.push('public facts are not verified');if(org.eligibility_status!=='eligible')reason.push('operational eligibility is not approved');if(org.verification_status==='inactive'||org.eligibility_status==='ineligible')reason.push('organization is inactive or ineligible');if(account.organizationId&&account.organizationId!==org.id)reason.push('account is already linked elsewhere');
      if(approve&&reason.length){app.flash(`Cannot approve: ${reason.join('; ')}.`, 'error');return;}
      if(approve){req.status='approved';req.reviewed_by=u.id;req.updated_at=new Date().toISOString();org.registration_status='approved';org.participation_status='participating';account.organizationId=org.id;account.accessApproved=true;account.verified=true;app.log(`Approved ${account.org} for ${org.name}`);app.flash('Organization affiliation approved; operational access enabled.');}
      else{req.status='rejected';req.reviewed_by=u.id;req.updated_at=new Date().toISOString();if(!d.organizationRequests.some(x=>x.organization_id===org.id&&x.status==='approved'))org.registration_status=d.organizationRequests.some(x=>x.organization_id===org.id&&x.status==='pending'&&x.id!==req.id)?'registered':'unclaimed';app.log(`Rejected organization access request for ${org.name}`);app.flash('Organization access request rejected.');}
      app.save();app.render();return;
    }
    if(action.startsWith('org-add-new-')){
      event.preventDefault();event.stopImmediatePropagation();if(!isAdmin())return;
      const requestId=action.slice('org-add-new-'.length),req=d.organizationRequests.find(x=>x.id===requestId&&x.status==='pending'&&x.request_type==='new_organization'&&!x.organization_id);if(!req)return;
      const proposal=req.proposed_organization,account=d.users.find(x=>x.id===req.user_id);if(!proposal||!account)return;
      const orgType=accountOrgType(account.role);
      if(!orgType||proposal.org_type!==orgType||!req.consent_confirmed){app.flash('Cannot add this request: the account role or authorization consent is invalid.','error');return;}
      if(account.organizationId){app.flash('This account is already linked to an organization. Resolve that link before adding another.','error');return;}
      const normalizedName=normalizeSearch(proposal.name),existing=records().find(x=>x.org_type===orgType&&normalizeSearch(x.name)===normalizedName);
      let org=existing;
      if(!org){
        org={id:`NEW-${uid().toUpperCase()}`,name:String(proposal.name||'').trim(),org_type:orgType,category:String(proposal.category||'').trim(),district:proposal.district||'Kannur',town:String(proposal.town||'').trim(),address:String(proposal.address||'').trim(),public_phone:String(proposal.public_phone||'').trim(),public_email:String(proposal.public_email||'').trim(),website:safeExternalUrl(proposal.website)||'',photo_data:safeImageData(proposal.photo_data)||null,latitude:null,longitude:null,food_categories:String(proposal.food_categories||proposal.category||'').trim(),dietary_options:null,opening_hours:null,license_details:null,service_area:String(proposal.town||'').trim(),registration_details:null,approximate_food_requirements:null,accepted_food_categories:null,collection_capacity:null,operating_schedule:null,source_name:proposal.website?'Website submitted by applicant':'Applicant submission',source_url:safeExternalUrl(proposal.website)||null,source_checked_at:null,verified_information:[],unknown_information:['Organization identity and public details are unverified.','Operational eligibility is unassessed.','Participation access requires administrator approval.'],verification_notes:'Submitted by an account holder. Administrator verification is pending.',eligibility_notes:'Not yet assessed.',verification_status:'pending_verification',eligibility_status:'unassessed',registration_status:'registered',participation_status:'consent_pending',verification_date:null,verification_outcome:''};
        d.organizations.unshift(org);
      }
      req.request_type='affiliation';req.organization_id=org.id;req.directory_added_at=existing?null:new Date().toISOString();req.added_by=u.id;req.updated_at=new Date().toISOString();
      account.organizationId=org.id;account.accessApproved=false;account.verified=false;
      if(!existing){org.registration_status='registered';org.participation_status='consent_pending';}
      app.log(existing?`Matched ${account.org} to existing organization ${org.name}`:`Added ${org.name} to the directory for verification`);app.save();app.render();app.flash(existing?'This organization already exists. The applicant is linked to its affiliation review.':'Organization added to the directory. Verify its public details and eligibility before approving access.');return;
    }
    if(action.startsWith('org-flag-listing-')||action.startsWith('org-clear-listing-')){
      event.preventDefault();event.stopImmediatePropagation();if(!isAdmin())return;
      const clear=action.startsWith('org-clear-listing-'),prefix=clear?'org-clear-listing-':'org-flag-listing-',id=action.slice(prefix.length),listing=d.listings.find(x=>String(x.id)===id);if(!listing)return;
      if(clear){if(listing.status==='Flagged for Review')listing.status=new Date(listing.deadline)<=new Date()?'Expired':'Available';app.log(`Cleared review flag for ${listing.item}`);app.flash('Listing flag cleared after review.');}
      else if(['Picked Up','Collected','Cancelled','Expired'].includes(listing.status)){app.flash('This listing cannot be flagged in its current status.','error');return;}
      else{listing.status='Flagged for Review';app.log(`Flagged ${listing.item} for review`);app.flash('Listing flagged for human review.');}
      app.save();app.render();return;
    }
    if(action.startsWith('org-cancel-listing-')){
      event.preventDefault();event.stopImmediatePropagation();const id=action.slice('org-cancel-listing-'.length),listing=d.listings.find(x=>String(x.id)===id&&x.donorId===u?.id);if(!listing||u?.role!=='donor'||!['Available','Expired'].includes(listing.status)){app.flash('Only your available or expired listings can be cancelled.','error');return;}
      listing.status='Cancelled';d.reservations.filter(x=>x.listingId===listing.id&&['Pending','Confirmed'].includes(x.status)).forEach(x=>x.status='Cancelled');app.log(`Cancelled food listing: ${listing.item}`);app.save();app.render();app.flash('Listing cancelled.');return;
    }
  }
  function handleSubmit(event) {
    const form=event.target,app=api(),d=state(),u=current();
    if(form.matches('[data-form="listing"]')&&(!u||u.role!=='donor'||u.accessApproved===false)){event.preventDefault();event.stopImmediatePropagation();app.flash('Request organization affiliation and wait for approval before posting food.','error');location.hash='organizations';return;}
    if(form.matches('[data-form="new-organization"]')){
      event.preventDefault();event.stopImmediatePropagation();if(!u){location.hash='login';return;}
      if(!accountOrgType(u.role)){app.flash('Only donor and recipient accounts can submit an organization.','error');return;}
      if(u.organizationId||requests().some(req=>req.user_id===u.id&&req.status==='pending')){app.flash('This account already has an organization request under review.','error');location.hash='organizations';return;}
      const v=Object.fromEntries(new FormData(form).entries()),orgType=accountOrgType(u.role),name=String(v.name||'').trim(),category=String(v.category||'').trim(),town=String(v.town||'').trim(),website=String(v.website||'').trim();
      if(!name||!category||!town||!v.consent){app.flash('Complete the required organization details and authorization consent.','error');return;}
      if(website&&!safeExternalUrl(website)){app.flash('Enter a valid http or https organization website.','error');return;}
      const existing=records().find(org=>org.org_type===orgType&&normalizeSearch(org.name)===normalizeSearch(name));
      if(existing){app.flash('This organization is already listed. Open its record and submit an affiliation request.','error');location.hash=`organization/${encodeURIComponent(existing.id)}`;return;}
      const duplicate=requests().find(req=>req.status==='pending'&&req.request_type==='new_organization'&&req.proposed_organization?.org_type===orgType&&normalizeSearch(req.proposed_organization?.name)===normalizeSearch(name));
      if(duplicate){app.flash('A request for this organization is already under administrator review.','error');location.hash='organizations';return;}
      const now=new Date().toISOString(),proposal={name,org_type:orgType,category,town,address:String(v.address||'').trim(),public_phone:String(v.public_phone||u.phone||'').trim(),public_email:String(v.public_email||'').trim(),website,food_categories:category};
      d.organizationRequests.unshift({id:uid(),request_type:'new_organization',organization_id:null,proposed_organization:proposal,user_id:u.id,message:String(v.message||'').trim(),consent_confirmed:true,status:'pending',created_at:now,updated_at:now});
      app.log(`Submitted new ${typeName(orgType).toLowerCase()} organization request for ${name}`);app.save();location.hash='organizations';app.render();app.flash('Request sent to the administrator for review.');return;
    }
    if(form.matches('[data-form="organization-request"]')){
      event.preventDefault();event.stopImmediatePropagation();if(!u){location.hash='login';return;}
      const org=byId(form.dataset.organizationId),v=Object.fromEntries(new FormData(form).entries());if(!org)return;
      if(accountOrgType(u.role)!==org.org_type){app.flash(`Use a ${typeName(org.org_type).toLowerCase()} account to request this organization.`, 'error');return;}
      if(!v.consent){app.flash('Confirm that you are authorized and consent to participate.','error');return;}
      if(u.organizationId&&u.organizationId!==org.id){app.flash('This account is already linked to another organization. Contact an administrator to change it.','error');return;}
      if(u.accessApproved&&u.organizationId===org.id){app.flash('This account already has approved access.');return;}
      let req=d.organizationRequests.find(x=>x.organization_id===org.id&&x.user_id===u.id);
      if(req&&req.status==='pending'){app.flash('Your request is already waiting for review.','error');return;}
      if(!req){req={id:uid(),organization_id:org.id,user_id:u.id,created_at:new Date().toISOString()};d.organizationRequests.push(req);}
      req.message=v.message.trim();req.consent_confirmed=true;req.status='pending';req.updated_at=new Date().toISOString();org.registration_status='registered';org.participation_status='consent_pending';app.log(`Requested access to ${org.name}`);app.save();app.render();app.flash('Request sent. Donation operations remain locked until approval.');return;
    }
    if(form.matches('[data-form="directory-edit"]')){
      event.preventDefault();event.stopImmediatePropagation();if(!isAdmin())return;
      const org=byId(form.dataset.organizationId),v=Object.fromEntries(new FormData(form).entries());if(!org)return;
      org.verification_status=v.verification_status;org.eligibility_status=v.eligibility_status;org.verification_date=v.verification_date||null;org.verification_outcome=v.verification_outcome.trim();org.verification_notes=v.verification_notes.trim();org.eligibility_notes=v.eligibility_notes.trim();
      if(org.verification_status!=='verified'||org.eligibility_status!=='eligible')d.users.filter(x=>x.organizationId===org.id).forEach(x=>{x.accessApproved=false;x.verified=false;});
      app.log(`Updated directory review for ${org.name}`);app.save();location.hash=`organization/${encodeURIComponent(org.id)}`;app.flash('Directory review saved. Participation approval remains separate.');return;
    }
  }
  function init() {
    const d=state();if(!d)return;
    if(!Array.isArray(d.organizations))d.organizations=[];
    if(!Array.isArray(d.organizationRequests))d.organizationRequests=[];
  }
  function render(route) {
    const [path,query='']=route.split('?');
    if(path==='organizations')return directoryPage(new URLSearchParams(query).get('type')||'all');
    if(path==='new-organization-request')return newOrganizationForm();
    if(route.startsWith('organization/'))return organizationDetail(route.slice('organization/'.length));
    if(route==='organization-requests')return accessRequestsPage();
    if(route==='admin-organizations')return adminDirectoryPage();
    if(route.startsWith('admin-org-edit/'))return adminOrganizationEdit(route.slice('admin-org-edit/'.length));
    if(route==='admin-accounts')return accountsPage();
    if(route==='admin-listings')return listingsPage();
    return '';
  }
  function handles(route) { const path=route.split('?')[0];return path==='organizations'||path==='new-organization-request'||path.startsWith('organization/')||path==='organization-requests'||path==='admin-organizations'||path.startsWith('admin-org-edit/')||path==='admin-accounts'||path==='admin-listings'; }
  document.addEventListener('click',handleClick,true);
  document.addEventListener('submit',handleSubmit,true);
  window.RePlateDirectory={init,handles,render,afterRender,accessGate};
})();
