#/************************************************************
# * File Name:  nodetodolist.spec
# (c) 2020 C Delezenski < cmd184psu@gmail.com >
# All Rights Reserved.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.
#
# ************************************************************/

Summary: Node JS based Todolist Frontend (html/js/css/images) and backend
Name: NodeJS-Todolist
Version: 1.0.0
Release: 1
License: APL2_
Group: Applications
Source0: %{name}-%{version}.tar.gz
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-buildroot
Prefix:/usr
Requires: NodeJS-Services
Requires: jq
%description

%prep
%setup -q

%build
#we do not use autoconf
#%configure
make

%install
rm -rf $RPM_BUILD_ROOT
make DESTDIR="$RPM_BUILD_ROOT" install

%post

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(755,root,root,-)
/opt/NodeTodolist
/etc/init.d/nodetodolist.service

%changelog
* Sat Aug 1 2020 C Delezenski <cmd184psu@gmail.com>
- First Release

